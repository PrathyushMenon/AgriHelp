import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useColorScheme,
} from "react-native";
import * as Location from "expo-location";
import axios from "axios";
import { useNavigation } from '@react-navigation/native';

const WeatherSoilInfo: React.FC = () => {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const theme = useColorScheme();

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setLoading(true);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          throw new Error("Location permission denied. Please enable GPS.");
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        console.log("Location acquired:", latitude, longitude);

        const API_URL = "http://192.168.0.170:5000";
        const response = await axios.get(`${API_URL}/weather`, {
          params: { lat: latitude, lon: longitude },
        });

        if (response.status === 200) {
          setWeatherData({
            rainfall:
              response.data.rainfall !== "No Data"
                ? parseFloat(response.data.rainfall).toFixed(2)
                : "No Data",
            soilMoisture:
              response.data.soil_moisture_top !== "No Data"
                ? `${(parseFloat(response.data.soil_moisture_top) * 100).toFixed(2)} %`
                : "No Data",
            ndvi:
              response.data.ndvi !== "No Data"
                ? parseFloat(response.data.ndvi).toFixed(4)
                : "No Data",
            advice: {
              english: response.data.advice?.english ?? "No advice available.",
              hindi: response.data.advice?.hindi ?? "कोई सलाह उपलब्ध नहीं है।",
            },
          });
        } else {
          throw new Error("API request failed.");
        }
      } catch (error: any) {
        console.error("Error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, []);

  // Language-specific text
  const textContent = {
    en: {
      title: "Weather & Soil Conditions",
      rainfall: "Rainfall",
      soilMoisture: "Soil Moisture",
      ndvi: "NDVI (Vegetation Health)",
      advice: "Farming Advice",
    },
    hi: {
      title: "मौसम और मिट्टी की स्थिति",
      rainfall: "वर्षा",
      soilMoisture: "मिट्टी की नमी",
      ndvi: "एनडीवीआई (वनस्पति स्वास्थ्य)",
      advice: "कृषि सलाह",
    },
  };

  const currentText = textContent[language];

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View
        style={[
          styles.container,
          { backgroundColor: theme === "dark" ? "#1A1A1A" : "#FFFFFF" },
        ]}
      >
        <Text
          style={[
            styles.title,
            { color: theme === "dark" ? "#FFFFFF" : "#2C3E50" },
          ]}
        >
          {currentText.title}
        </Text>

        {/* Language Toggle */}
        <View style={styles.languageSelector}>
          <TouchableOpacity
            onPress={() => setLanguage("en")}
            style={[
              styles.languageButton,
              language === "en" && styles.activeLanguageButton,
            ]}
          >
            <Text
              style={[
                styles.languageText,
                language === "en" && styles.activeLanguageText,
              ]}
            >
              English
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setLanguage("hi")}
            style={[
              styles.languageButton,
              language === "hi" && styles.activeLanguageButton,
            ]}
          >
            <Text
              style={[
                styles.languageText,
                language === "hi" && styles.activeLanguageText,
              ]}
            >
              हिन्दी
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498DB" />
            <Text style={styles.loadingText}>Fetching Data...</Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <Text style={styles.errorText}>
            {language === "en"
              ? "Error: " + error
              : "त्रुटि: " + (error === "Location permission denied. Please enable GPS."
                  ? "स्थान अनुमति अस्वीकृत। कृपया GPS सक्षम करें।"
                  : error)}
          </Text>
        )}

        {/* Data Display */}
        {weatherData && !loading && !error && (
          <View style={styles.card}>
            <View style={styles.dataRow}>
              <Text style={styles.label}>{currentText.rainfall}:</Text>
              <Text style={styles.value}>{weatherData.rainfall} mm</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.label}>{currentText.soilMoisture}:</Text>
              <Text style={styles.value}>{weatherData.soilMoisture}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.label}>{currentText.ndvi}:</Text>
              <Text style={styles.value}>{weatherData.ndvi}</Text>
            </View>
            <View style={styles.adviceSection}>
              <Text style={styles.adviceLabel}>{currentText.advice}:</Text>
              <Text style={styles.adviceText}>
                {language === "hi"
                  ? weatherData.advice.hindi
                  : weatherData.advice.english}
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
    backgroundColor: "#F5F6FA", // Light neutral background
  },
  container: {
    flex: 1,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  languageSelector: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  languageButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#E8ECEF",
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  activeLanguageButton: {
    backgroundColor: "#3498DB",
    borderColor: "#2980B9",
  },
  languageText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4A5568",
  },
  activeLanguageText: {
    color: "#FFFFFF",
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#7F8C8D",
    fontWeight: "500",
  },
  errorText: {
    fontSize: 16,
    color: "#E74C3C",
    textAlign: "center",
    marginTop: 20,
    fontWeight: "500",
    paddingHorizontal: 16,
  },
  card: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ECEFF1",
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
  },
  value: {
    fontSize: 18,
    fontWeight: "400",
    color: "#4A5568",
  },
  adviceSection: {
    marginTop: 16,
    paddingTop: 12,
  },
  adviceLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 8,
  },
  adviceText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#4A5568",
    lineHeight: 24,
  },
});

export default WeatherSoilInfo;