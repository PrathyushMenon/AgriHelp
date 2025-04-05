// Analysis.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from '@react-navigation/native';

type RootStackParamList = {
  scan: undefined;
  analysis: {
    analysisData: {
      result: {
        diseases: {
          id: string;
          name: string;
          probability: number;
          scientific_name: string | null;
          summary: string;
        }[];
      };
    };
    imageUri: string;
  };
  weather: undefined;
  forecast: undefined;
  Assistant: undefined;
};

type AnalysisRouteProp = RouteProp<RootStackParamList, "analysis">;

const AnalysisScreen: React.FC = () => {
  const navigation = useNavigation(); // Use hook if not directly passed
  const route = useRoute<AnalysisRouteProp>();
  const params = route.params;
  const [language, setLanguage] = useState<"english" | "hindi">("english"); // Language state

  useEffect(() => {
    console.log("AnalysisScreen params:", params);
    if (params) {
      console.log("Maladies count:", params.analysisData.result.diseases.length);
    }
  }, [params]);

  if (!params) {
    return (
      <View style={styles.grandioseLoadingContainer}>
        <ActivityIndicator size="large" color="#4B5E40" />
        <Text style={styles.LoadingText}>
          {language === "english"
            ? "Preparing Your Analysis…"
            : "आपका शाही विश्लेषण तैयार हो रहा है…"}
        </Text>
      </View>
    );
  }

  const { analysisData, imageUri } = params;
  const diseases = analysisData.result.diseases;

  // Language-specific text
  const textContent = {
    english: {
      title: "Your Analysis Results",
      confidence: "Confidence",
      noDiseases: "No Disease detected your crop is in good health!",
    },
    hindi: {
      title: "आपके शाही विश्लेषण परिणाम",
      confidence: "विश्वास",
      noDiseases: "कोई बीमारी नहीं मिली! आपकी वनस्पति शानदार स्वास्थ्य में राज करती है!",
    },
  };

  const currentText = textContent[language];

  // Toggle language
  const toggleLanguage = () => {
    setLanguage(language === "english" ? "hindi" : "english");
  };

  return (
    <View style={styles.Container}>
      <LinearGradient
        colors={["#DDE5B6", "#A9C1A1"]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.Title}>{currentText.title}</Text>

        <TouchableOpacity onPress={toggleLanguage} style={styles.languageToggle}>
          <Text style={styles.languageToggleText}>
            {language === "english" ? "हिन्दी" : "English"}
          </Text>
        </TouchableOpacity>

        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={styles.Image}
            resizeMode="cover"
          />
        )}

        {diseases.length > 0 ? (
          diseases.map((disease) => (
            <LinearGradient
              key={disease.id}
              colors={["#A9C1A1", "#8AA894"]}
              style={styles.DiseaseCard}
            >
              <Text style={styles.DiseaseName}>{disease.name}</Text>
              <Text style={styles.Probability}>
                {currentText.confidence}: {(disease.probability * 100).toFixed(1)}%
              </Text>
              <Text style={styles.Summary}>{disease.summary}</Text>
            </LinearGradient>
          ))
        ) : (
          <LinearGradient
            colors={["#6B8A75", "#A9C1A1"]}
            style={styles.NoDiseasesCard}
          >
            <Text style={styles.NoDiseasesText}>
              {currentText.noDiseases}
            </Text>
          </LinearGradient>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  grandioseLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#DDE5B6",
  },
  LoadingText: {
    marginTop: 12,
    fontSize: 20,
    color: "#000000",
    fontFamily: "Times New Roman",
    fontStyle: "italic",
    textShadowColor: "#4B5E40",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  Container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  Title: {
    fontSize: 36, // Slightly larger for emphasis
    fontWeight: "900",
    marginBottom: 20,
    textAlign: "center",
    color: "#FFFFFF", // Changed to white
    fontFamily: "Times New Roman",
    textTransform: "uppercase",
    letterSpacing: 2,
    textShadowColor: "#4B5E40",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
  languageToggle: {
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    alignSelf: "center",
  },
  languageToggleText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  Image: {
    width: "100%",
    height: 300,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 4,
    borderColor: "#6B8A75",
    shadowColor: "#4B5E40",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  DiseaseCard: {
    borderRadius: 16, // Larger radius
    padding: 28, // Increased padding
    marginBottom: 20,
    minHeight: 140, // Fixed minimum height for larger cards
    shadowColor: "#4B5E40",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: "#6B8A75",
  },
  DiseaseName: {
    fontSize: 28, // Slightly larger
    fontWeight: "bold",
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 10,
    textShadowColor: "#4B5E40",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  Probability: {
    fontSize: 20, // Slightly larger
    color: "#000000",
    marginBottom: 12,
    fontStyle: "italic",
  },
  Summary: {
    fontSize: 18, // Slightly larger
    lineHeight: 24,
    color: "#000000",
    fontFamily: "Georgia",
  },
  NoDiseasesCard: {
    borderRadius: 16, // Larger radius
    padding: 34, // Increased padding
    minHeight: 140, // Fixed minimum height for larger card
    alignItems: "center",
    marginTop: 30,
    borderWidth: 3,
    borderColor: "#6B8A75",
    shadowColor: "#4B5E40",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  NoDiseasesText: {
    fontSize: 24, // Slightly larger
    color: "#000000",
    textAlign: "center",
    fontFamily: "Times New Roman",
    fontStyle: "italic",
    textShadowColor: "#4B5E40",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 6,
  },
});

export default AnalysisScreen;