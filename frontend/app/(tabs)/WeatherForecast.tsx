import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  useColorScheme,
  ImageBackground,
} from "react-native";
import axios from "axios";
import * as Location from "expo-location";
import { Feather } from "@expo/vector-icons"; 
import { useNavigation } from '@react-navigation/native';


interface ForecastData {
  date: string;
  max_temp: number;
  min_temp: number;
  precipitation: number;
  wind_speed: number;
}

const WeatherForecast: React.FC = () => {
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useColorScheme();

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setLoading(true);

        // Get User Location
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          throw new Error("Location permission denied. Please enable GPS.");
        }

        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        console.log("Got location:", latitude, longitude);

        // Fetch weather data from backend
        const API_URL = "https://agrihelp-backend.onrender.com/";
        const response = await axios.get(`${API_URL}/forecast`, {
          params: { lat: latitude, lon: longitude },
        });

        console.log("Forecast API Response:", response.data);

        if (response.status === 200 && response.data.forecast) {
          setForecast(response.data.forecast);
        } else {
          throw new Error(" Failed to fetch forecast.");
        }
      } catch (error) {
        console.error("Error fetching forecast:", error);
        setError("Could not fetch forecast data.");
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, []);

  return (
    <ImageBackground
      source={require("./assets/images/weather-bg.png")} 
      style={styles.background}
    >
      <View style={[styles.container, { backgroundColor: theme === "dark" ? "rgba(30,30,30,0.85)" : "rgba(255,255,255,0.85)" }]}>
        <Text style={[styles.title, { color: theme === "dark" ? "#FFF" : "#000" }]}>
           Weekly Weather Forecast
        </Text>

        {loading && <ActivityIndicator size="large" color="#2F9E44" />}
        {error && <Text style={styles.errorText}>{error}</Text>}

        <FlatList
          data={forecast}
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => (
            <View style={styles.forecastCard}>
              <Text style={styles.date}>{item.date}</Text>

              <View style={styles.weatherDetails}>
                {/*  Temperature */}
                <View style={styles.weatherItem}>
                  <Feather name="thermometer" size={20} color="#FF5733" />
                  <Text style={styles.weatherText}>Max: {item.max_temp}°C</Text>
                  <Text style={styles.weatherText}>Min: {item.min_temp}°C</Text>
                </View>

                {/* Rain */}
                <View style={styles.weatherItem}>
                  <Feather name="cloud-rain" size={20} color="#3498DB" />
                  <Text style={styles.weatherText}>Rain: {item.precipitation} mm</Text>
                </View>

                {/*  Wind */}
                <View style={styles.weatherItem}>
                  <Feather name="wind" size={20} color="#2F9E44" />
                  <Text style={styles.weatherText}>Wind: {item.wind_speed} km/h</Text>
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </ImageBackground>
  );
};

// Styles
const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    padding: 20,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },
  forecastCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 15,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  date: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  weatherDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weatherItem: {
    alignItems: "center",
  },
  weatherText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 5,
  },
});

export default WeatherForecast;
