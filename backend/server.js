require("dotenv").config();
const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const { GoogleAuth } = require("google-auth-library");
const ee = require("@google/earthengine");
const fileUpload = require("express-fileupload");
const speech = require('@google-cloud/speech');
const textToSpeech = require('@google-cloud/text-to-speech');
const util = require('util');
const bodyParser = require("body-parser");
const { TranslationServiceClient } = require('@google-cloud/translate');


const app = express();

app.use(express.json());
app.use(cors()); // Allow frontend to access API
app.use(fileUpload());
app.use(express.json()); // To parse JSON payloads


// API Keys & Environment Variables
const CROP_HEALTH_API_URL = "https://crop.kindwise.com/api/v1/identification";
const CROP_HEALTH_API_KEY = process.env.CROP_HEALTH_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // Access the service account key stored as an environment variable

// Access the secret stored in the environment variable
const SERVICE_ACCOUNT_KEY_JSON = process.env.SERVICE_ACCOUNT_KEY_FILE;

// Check if the service account key environment variable is available
if (!SERVICE_ACCOUNT_KEY_JSON) {
    throw new Error('Google Earth Engine service account credentials not found in environment');
}

// Parse the JSON content
let credentials;
try {
    credentials = JSON.parse(SERVICE_ACCOUNT_KEY_JSON);
    console.log('Credentials loaded:'); // Log the credentials (in development only)
} catch (err) {
    console.error('Error parsing service account JSON:', err);
    process.exit(1);
}

// Check if required API keys are available
if (!CROP_HEALTH_API_KEY || !GEMINI_API_KEY) {
    console.error("Missing API Key(s)! Check your .env file.");
    process.exit(1);
}

console.log('API Keys and credentials are successfully loaded and ready to use!');


// ulter: Image Upload Configuration
const upload = multer({ dest: "uploads/" });

// Convert Image to Base64
const encodeImageToBase64 = (filePath) => {
  try {
    const imageBuffer = fs.readFileSync(filePath);
    return imageBuffer.toString("base64");
  } catch (error) {
    console.error(" Error reading file:", error);
    return null;
  }
};

async function initializeGEE() {
    try {
        await ee.data.authenticateViaPrivateKey(credentials); // Authenticate using the credentials
        console.log('Successfully authenticated with Google Earth Engine!');
    } catch (error) {
        console.error('Error initializing GEE:', error);
        process.exit(1);
    }
}

initializeGEE();

// Fetch GEE Weather & Soil Data Route
app.get("/weather", async (req, res) => {
  const { lat, lon } = req.query;

  // Validate input
  if (!lat || !lon) {
    return res.status(400).json({ error: "Latitude and Longitude required" });
  }

  try {
    console.log(`📡 Fetching GEE data for (${lat}, ${lon})...`);
    const point = ee.Geometry.Point([parseFloat(lon), parseFloat(lat)]);

    // NDVI using Landsat 8
    const landsatCollection = ee.ImageCollection("LANDSAT/LC08/C02/T1_TOA")
      .filterBounds(point)
      .filterDate("2024-01-25", "2024-03-05");
    
    // Check if Landsat collection has data
    const landsatCount = await landsatCollection.size().getInfo();
    console.log("Landsat Collection Count:", landsatCount);
    
    if (landsatCount > 0) {
      const ndviImage = landsatCollection.map((image) => image.addBands(image.normalizedDifference(["B5", "B4"]).rename("NDVI")));
      const ndviMean = ndviImage.mean();
      const ndviValue = await ndviMean.reduceRegion({ reducer: ee.Reducer.mean(), geometry: point, scale: 30, maxPixels: 1e9 }).getInfo();
      console.log("NDVI Value:", ndviValue);
    } else {
      console.error("No data found in Landsat collection for the given date and location.");
    }

    // Real-Time Topsoil Moisture using NASA SMAP
    const soilMoistureDataset = ee.ImageCollection("NASA/SMAP/SPL3SMP_E/006")
      .filterBounds(point)
      .filterDate("2024-01-28", "2024-03-02");
    
    // Check if soil moisture dataset has data
    const soilMoistureCount = await soilMoistureDataset.size().getInfo();
    console.log("Soil Moisture Dataset Count:", soilMoistureCount);

    if (soilMoistureCount > 0) {
      const soilMoistureMean = soilMoistureDataset.mean();
      const soilMoistureValue = await soilMoistureMean.reduceRegion({ reducer: ee.Reducer.mean(), geometry: point, scale: 9000, maxPixels: 1e9 }).getInfo();
      console.log("Soil Moisture Value:", soilMoistureValue);
    } else {
      console.error("No data found in Soil Moisture dataset for the given date and location.");
    }

    // Rainfall using CHIRPS
    const rainfallDataset = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY")
      .filterBounds(point)
      .filterDate("2024-03-01", "2024-03-02");
    
    // Check if rainfall dataset has data
    const rainfallCount = await rainfallDataset.size().getInfo();
    console.log("Rainfall Dataset Count:", rainfallCount);

    if (rainfallCount > 0) {
      const rainfallMean = rainfallDataset.mean();
      const rainfallValue = await rainfallMean.reduceRegion({ reducer: ee.Reducer.mean(), geometry: point, scale: 5000, maxPixels: 1e9 }).getInfo();
      console.log("Rainfall Value:", rainfallValue);
    } else {
      console.error("No data found in Rainfall dataset for the given date and location.");
    }

    // Farming advice from Gemini API
    let farmingAdvice = { english: "⚠️ No English advice available.", hindi: "⚠️ No Hindi advice available." };

    try {
      console.log("📡 Fetching farming advice from Gemini...");

      const adviceResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `Given the following weather conditions:
- Rainfall: ${rainfallValue?.precipitation || 'No Data'}
- NDVI: ${ndviValue?.NDVI || 'No Data'}
- Soil Moisture (Top 0-7cm): ${soilMoistureValue?.soil_moisture_am || 'No Data'}

Provide **farming advice in Hindi first, followed by English.**

1. Explain how these weather conditions affect farming.
2. Suggest suitable crops based on the data.
3. Warn about potential crop diseases.
4. Keep the response clear, farmer-friendly, and practical.
5. Avoid unnecessary introductions.
6. No bold or italic or anything like that
answer like this:
Hindi:
मौसम की जानकारी के अनुसार, बारिश का कोई आंकड़ा नहीं है, एनडीवीआई 0.1503 है, और मिट्टी में नमी (ऊपरी 0-7 सेमी) 0.1379 है।

1. इन परिस्थितियों का खेती पर प्रभ               भाव: बारिश का आंकड़ा नहीं होने से यह पता नहीं चल रहा है कि बारिश हुई है या नहीं। एनडीवीआई 0.1503 बताता है कि वनस्पति कम है, शायद खेत                 त में हरियाली कम है या फसलें कमजोर हैं। मिट्टी में नमी 0.1379 है, जो दर्शाता है कि मिट्टी में नमी का स्तर कम है, और फसलों को पानी की कमी हो सकती है।

English:
According to the weather information, rainfall data is unavailable, the NDVI is 0.1503, and the soil moisture (top 0-7cm) is 0.1379.

1. Impact of these conditions on farming: The unavailable rainfall data makes it uncertain if it has rained recently. An NDVI of 0.1503 indicates low vegetation, potentially meaning less greenery in the field or weaker crops. Soil moisture of 0.1379 suggests low moisture levels in the soil, which could lead to water stress for crops.

2. Suitable crops: Given the low moisture, consider planting drought-tolerant crops like pearl millet (bajra), sorghum (jowar), maize (makka), or wheat.
2. Check for potential pests or diseases in such conditions.
      `
                }
              ]
            }
          ]
        },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Gemini Response:", adviceResponse?.data);
      const adviceText = adviceResponse?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (adviceText) {
        console.log(" Raw Advice Text from Gemini:", adviceText);
        const hindiMatch = adviceText.match(/Hindi\s*[:]*\s*([\s\S]+?)(?=\s*English:|$)/i);
        const englishMatch = adviceText.match(/English\s*[:]*\s*([\s\S]+)/i);

        if (hindiMatch) {
          farmingAdvice.hindi = hindiMatch[1].replace(/[*#\s]+/g, " ").trim();
        }
        if (englishMatch) {
          farmingAdvice.english = englishMatch[1].replace(/[*#\s]+/g, " ").trim();
        }
      } else {
        console.log("No raw advice text found.");
      }
    } catch (geminiError) {
      console.error(" Gemini API Error:", geminiError.response?.data || geminiError.message);
    }

    console.log("Sending Response:", { ...weatherData, advice: farmingAdvice });
    res.json({ ...weatherData, advice: farmingAdvice });

  } catch (error) {
    console.error(" GEE Processing Error:", error.message);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

//  Route to fetch 7-day weather forecast
app.get("/forecast", async (req, res) => {
  try {
      const { lat, lon } = req.query;

      if (!lat || !lon) {
          return res.status(400).json({ error: "Latitude and Longitude are required" });
      }

      const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto`;

      console.log("Fetching weather from:", API_URL);

      const response = await axios.get(API_URL);
      const data = response.data;

      if (!data || !data.daily || !data.daily.time) {
          return res.status(500).json({ error: "Invalid response from weather API" });
      }

      const forecast = data.daily;
      const formattedForecast = forecast.time.map((date, index) => ({
          date,
          max_temp: forecast.temperature_2m_max[index] || 0,
          min_temp: forecast.temperature_2m_min[index] || 0,
          precipitation: forecast.precipitation_sum[index] || 0,
          wind_speed: forecast.wind_speed_10m_max[index] || 0,
      }));

      res.json({ forecast: formattedForecast });
  } catch (error) {
      console.error("Weather API Error:", error.message);
      res.status(500).json({ error: "Failed to fetch weather data", details: error.message });
  }
});

// Speech-to-Text API
app.post("/speech-to-text", async (req, res) => {
  try {
    if (!req.files || !req.files.audio) {
      return res.status(400).send(" Audio file is required");
    }

    const audioBuffer = req.files.audio.data; // Get audio file buffer
    const audioBase64 = audioBuffer.toString("base64"); // Convert to Base64

    const requestPayload = {
      config: {
        encoding: "MP3",
        sampleRateHertz: 16000,
        languageCode: "hi-IN",
      },
      audio: { content: audioBase64 },
    };

    const response = await axios.post(
      `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.GOOGLE_API_KEY}`,
      requestPayload,
      { headers: { "Content-Type": "application/json" } }
    );

    const transcription = response.data.results
      ?.map((r) => r.alternatives[0].transcript)
      .join("\n");

    console.log("Transcribed:", transcription);
    res.send({ transcription });
  } catch (err) {
    console.error(" STT error:", err.response?.data || err.message);
    res.status(500).send(" Speech-to-Text failed");
  }
});

// Gemini AI Help API
app.post("/gemini-advice", async (req, res) => {
  try {
    const { text } = req.body;
    console.log("📝 Received text:", text);

    const prompt = `You are a farming assistant. A farmer asked: "${text}". Reply with in english with concise advice and not bold.
      Avoid avoid bold or italics , and be practical. Use simple language. Don't include any greetings or introductions.`;

    const geminiRes = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,      {
        contents: [
          {
            parts: [
              {
                text: prompt, // Your prompt goes here
              },
            ],
          },
        ],
      },
      { headers: { "Content-Type": "application/json" } }
    );
    

    const aiReply = geminiRes?.data?.candidates?.[0]?.content?.parts?.[0]?.text || " Gemini didn't reply";

    res.send({ advice: aiReply });
  } catch (error) {
    console.error(" Gemini API Error:", error.response?.data || error.message);
    res.status(500).send({ error: "Gemini API error" });
  }
});

app.post("/translate", async (req, res) => {
  const { text, targetLanguage } = req.body;

  try {
    const response = await axios.post(
      `https://translation.googleapis.com/language/translate/v2`,
      {
        q: text,
        target: targetLanguage,
        format: "text",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        params: {
          key: process.env.GOOGLE_API_KEY,
        },
      }
    );

    const translatedText = response.data.data.translations[0].translatedText;
    res.json({ translatedText });
  } catch (error) {
    console.error(" Error translating text:", error.response?.data || error.message);
    res.status(500).json({ error: "Translation failed." });
  }
});

// Start Server
const port = process.env.PORT || 5000; // Use Render's port or fallback to 5000 locally
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
