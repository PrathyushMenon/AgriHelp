import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  Button,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ImageBackground,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

const ScanScreen: React.FC = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const navigation = useNavigation<any>();

  const captureImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const analyzeImage = async () => {
    if (!imageUri) {
      Alert.alert("No Image", "Please select or capture an image first.");
      return;
    }

    setIsUploading(true);

    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const apiResponse = await fetch("http://192.168.0.170:5000/analyze", {
        method: "POST",
        body: blob,
        headers: { "Content-Type": "image/jpeg" },
      });

      if (!apiResponse.ok) {
        throw new Error(`Server responded with status ${apiResponse.status}`);
      }

      const data = await apiResponse.json();
      console.log("📊 Analysis Result:", data);

      navigation.navigate("analysis", {
        analysisData: data,
        imageUri,
      });
    } catch (error: any) {
      console.error("❌ Upload Error:", error);
      Alert.alert("Upload Failed", error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ImageBackground
      source={require("./assets/images/image2.webp")} // Background image
      style={styles.opulentContainer}
      resizeMode="cover"
    >
      <View style={styles.overlay} /> {/* Semi-transparent overlay for readability */}
      <View style={styles.innerContainer}>
        <Text style={styles.Title}>Scan Your  Crop</Text>

        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={styles.Preview}
            resizeMode="cover"
          />
        )}

        <View style={styles.regalButtonGroup}>
          <LinearGradient
            colors={["#8AA894", "#6B8A75"]}
            style={styles.buttonGradient}
          >
            <Button
              title="Capture with Camera"
              onPress={captureImage}
              color="#000000"
            />
          </LinearGradient>

          <LinearGradient
            colors={["#8AA894", "#6B8A75"]}
            style={styles.buttonGradient}
          >
            <Button
              title="Select from Gallery"
              onPress={pickImage}
              color="#000000"
            />
          </LinearGradient>
        </View>

        <LinearGradient
          colors={["#6B8A75", "#A9C1A1"]}
          style={styles.analyzeButtonGradient}
        >
          <Button
            title="Analyze "
            onPress={analyzeImage}
            disabled={isUploading}
            color="#000000"
          />
        </LinearGradient>

        {isUploading && (
          <ActivityIndicator
            size="large"
            color="#4B5E40"
            style={styles.grandioseLoader}
          />
        )}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  opulentContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)", // Dark overlay for text readability
  },
  innerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  Title: {
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 30,
    color: "#FFFFFF",
    fontFamily: "Times New Roman",
    textTransform: "uppercase",
    letterSpacing: 2,
    textShadowColor: "#4B5E40",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
  Preview: {
    width: 340,
    height: 340,
    borderRadius: 20,
    marginBottom: 30,
    borderWidth: 4,
    borderColor: "#6B8A75",
    shadowColor: "#4B5E40",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
  },
  regalButtonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 30,
  },
  buttonGradient: {
    borderRadius: 12,
    padding: 4,
    width: "48%",
    shadowColor: "#4B5E40",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  analyzeButtonGradient: {
    borderRadius: 12,
    padding: 4,
    width: "100%",
    marginBottom: 30,
    borderWidth: 2,
    borderColor: "#6B8A75",
    shadowColor: "#4B5E40",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  grandioseLoader: {
    marginTop: 20,
    shadowColor: "#4B5E40",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
});

export default ScanScreen;