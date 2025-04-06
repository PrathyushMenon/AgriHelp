import React, { useReducer, useEffect, useRef, useState } from "react";
import { View, Text, Button, ActivityIndicator, StyleSheet, ScrollView } from "react-native";
import { Audio } from "expo-av";
import axios from "axios";
import * as FileSystem from "expo-file-system";
import { useNavigation } from '@react-navigation/native';

const SERVER_URL = "https://agrihelp-backend.onrender.com"; 

// State Interface
interface State {
  isRecording: boolean;
  transcription: string;
  responseHistory: string[];
  loading: boolean;
  error: string;
}

const initialState: State = {
  isRecording: false,
  transcription: "",
  responseHistory: [],
  loading: false,
  error: "",
};

type Action =
  | { type: "START_RECORDING" }
  | { type: "STOP_RECORDING" }
  | { type: "SET_TRANSCRIPTION"; payload: string }
  | { type: "ADD_RESPONSE"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "START_RECORDING":
      return { ...state, isRecording: true, error: "" };
    case "STOP_RECORDING":
      return { ...state, isRecording: false };
    case "SET_TRANSCRIPTION":
      return { ...state, transcription: action.payload };
    case "ADD_RESPONSE":
      return { ...state, responseHistory: [...state.responseHistory, action.payload] };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

// Language Translations
const translations = {
  en: {
    title: "🎙️ Ask Your Farming Question",
    start: "🎤 Start Recording",
    stop: "⏹ Stop Recording",
    error: "❌ Error",
    response: "🤖 Response",
    loading: "Loading...",
    noResponse: "❌ No response received.",
    switchToHindi: "हिंदी में स्विच करें",
    switchToEnglish: "Switch to English",
  },
  hi: {
    title: "🎙️ अपने खेती के सवाल पूछें",
    start: "🎤 रिकॉर्डिंग शुरू करें",
    stop: "⏹ रिकॉर्डिंग बंद करें",
    error: "❌ त्रुटि",
    response: "🤖 उत्तर",
    loading: "लोड हो रहा है...",
    noResponse: "❌ कोई उत्तर नहीं मिला।",
    switchToHindi: "अंग्रेजी में स्विच करें",
    switchToEnglish: "Switch to English",
  },
};

const VoiceAssistant: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const recorder = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    recorder.current = new Audio.Recording();
    return () => {
      recorder.current?.stopAndUnloadAsync();
    };
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("❌ Error requesting microphone permission:", error);
      return false;
    }
  };

  const startRecording = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      dispatch({ type: "SET_ERROR", payload: translations[language].error + ": Microphone permission denied." });
      return;
    }

    try {
      recorder.current = new Audio.Recording();
      await recorder.current.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recorder.current.startAsync();
      dispatch({ type: "START_RECORDING" });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: translations[language].error + ": Error starting recording." });
    }
  };

  const stopRecording = async () => {
    try {
      if (recorder.current) {
        await recorder.current.stopAndUnloadAsync();
        const uri = recorder.current.getURI();
        if (!uri) throw new Error(translations[language].error + ": Recording failed.");
        dispatch({ type: "STOP_RECORDING" });
        await sendAudioToServer(uri);
      }
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: `${translations[language].error}: ${error.message}` });
    }
  };

  const sendAudioToServer = async (uri: string) => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const formData = new FormData();
      formData.append("audio", {
        uri,
        type: "audio/m4a",
        name: "recording.m4a",
      });

      const res = await axios.post(`${SERVER_URL}/speech-to-text`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.transcription) {
        dispatch({ type: "SET_TRANSCRIPTION", payload: res.data.transcription });
        await fetchGeminiAdvice(res.data.transcription);
      } else {
        dispatch({ type: "SET_ERROR", payload: translations[language].noResponse });
      }
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: `${translations[language].error}: ${error.message}` });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const fetchGeminiAdvice = async (text: string) => {
    try {
      const response = await axios.post(`${SERVER_URL}/gemini-advice`, { text });
      let aiReply = response.data.advice || translations[language].noResponse;

      // Translate response if language is Hindi
      if (language === "hi") {
        const translationRes = await axios.post(`${SERVER_URL}/translate`, {
          text: aiReply,
          targetLanguage: "hi",  // Fix: Added targetLanguage here
        });
        aiReply = translationRes.data.translatedText || aiReply;
      }

      dispatch({ type: "ADD_RESPONSE", payload: aiReply });
      await synthesizeVoice(aiReply);
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: `${translations[language].error}: ${error.message}`,
      });
    }
  };

  const synthesizeVoice = async (text: string) => {
    try {
      const res = await axios.post(`${SERVER_URL}/text-to-speech`, { text }, {
        responseType: "arraybuffer",
      });

      const audioBuffer = res.data;
      const base64Audio = Buffer.from(audioBuffer).toString("base64");

      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${base64Audio}` },
        { shouldPlay: true }
      );

      await sound.playAsync();
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: `${translations[language].error}: ${err.message}` });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{translations[language].title}</Text>

      <Button
        title={state.isRecording ? translations[language].stop : translations[language].start}
        onPress={state.isRecording ? stopRecording : startRecording}
        color={state.isRecording ? "#e74c3c" : "#2ecc71"}
      />

      <Button
        title={language === "en" ? translations[language].switchToHindi : translations[language].switchToEnglish}
        onPress={() => setLanguage(language === "en" ? "hi" : "en")}
        color="#3498db"
        style={styles.switchButton}
      />

      {state.loading && <ActivityIndicator size="large" color="#2980b9" style={{ marginTop: 20 }} />}

      <ScrollView style={styles.responseContainer}>
        {state.responseHistory.map((response, index) => (
          <Text key={index} style={styles.text}>
            {translations[language].response} {index + 1}: {response}
          </Text>
        ))}
      </ScrollView>

      {state.error && <Text style={styles.error}>{state.error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#F5F6FA", // Light neutral background for a modern feel
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 28, // Larger for prominence
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
    color: "#2C3E50", // Darker, professional blue-gray
    letterSpacing: 0.5,
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    color: "#4A5568", // Softer gray for readability
    lineHeight: 24, // Improved readability
    paddingHorizontal: 8,
  },
  error: {
    marginTop: 20,
    fontSize: 16,
    color: "#E74C3C", // Clean red for errors
    textAlign: "center",
    fontWeight: "500",
    paddingHorizontal: 16,
  },
  responseContainer: {
    marginTop: 20,
    flex: 1,
    padding: 16,
    backgroundColor: "#FFFFFF", // White card for responses
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB", // Subtle border
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  switchButton: {
    marginTop: 16, // Adjusted spacing
    backgroundColor: "#3498DB", // Professional blue
    borderRadius: 20, // Rounded for polish
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
});

export default VoiceAssistant;
