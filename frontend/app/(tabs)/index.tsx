import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons, FontAwesome5, Feather, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import AppNavigator from './AppNavigator';  // Your navigator component (adjust path as necessary)
import { useRouter } from 'expo-router'; // Correct import
import { Button } from 'react-native';
import { useLink } from 'expo-router';
import { Link } from 'expo-router'; // Import Link for navigation

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// Translation data
const translations = {
  en: {
    goodMorning: 'Good Morning, Farmer',
    currentWeather: 'Current Weather',
    humidity: 'Humidity',
    wind: 'Wind',
    rain: 'Rain',
    soilMoisture: 'Soil Moisture',
    tooLow: 'Too dry - consider irrigation',
    optimal: 'Optimal moisture levels',
    wellHydrated: 'Well hydrated - no action needed',
    quickActions: 'Quick Actions',
    scanCrop: 'Scan Crop',
    weatherForecast: 'Weather Forecast',
    voiceAssistant: 'Voice Assistant',
    weatherSoilInfo: 'Soil And Weather Information',
    todayTip: "Today's Farming Tip",
    tipContent: 'Apply mulch around your plants to retain soil moisture and suppress weeds. Organic mulches like straw and wood chips also add nutrients as they decompose.',
    moisture: 'moisture',
    kmh: 'km/h',
    changeLang: 'हिंदी में बदलें',
    loading: 'Loading weather data...',
    locationError: 'Location permission denied',
    weatherError: 'Error fetching weather data',
  },
  hi: {
    goodMorning: 'सुप्रभात, किसान',
    currentWeather: 'वर्तमान मौसम',
    humidity: 'आर्द्रता',
    wind: 'हवा',
    rain: 'बारिश',
    soilMoisture: 'मिट्टी की नमी',
    tooLow: 'बहुत सूखा - सिंचाई पर विचार करें',
    optimal: 'इष्टतम नमी स्तर',
    wellHydrated: 'अच्छी तरह से हाइड्रेटेड - कोई कार्रवाई की आवश्यकता नहीं',
    quickActions: 'त्वरित कार्य',
    scanCrop: 'फसल स्कैन करें',
    weatherForecast: 'मौसम का पूर्वानुमान',
    voiceAssistant: 'आवाज सहायक',
    weatherSoilInfo : "मिट्टी और मौसम की जानकारी",
    todayTip: 'आज का कृषि टिप',
    tipContent: 'अपने पौधों के चारों ओर मल्च लगाएं ताकि मिट्टी की नमी बनी रहे और खरपतवार को दबा सके। स्ट्रॉ और लकड़ी के चिप्स जैसे जैविक मल्च विघटित होने पर पोषक तत्व भी जोड़ते हैं।',
    moisture: 'नमी',
    kmh: 'किमी/घंटा',
    changeLang: 'Switch to English',
    loading: 'मौसम डेटा लोड हो रहा है...',
    locationError: 'स्थान की अनुमति अस्वीकृत',
    weatherError: 'मौसम डेटा प्राप्त करने में त्रुटि',
  }
};

const HomePage = () => {
  // This function will handle feature press and navigate to a screen
  const handleFeaturePress = (screenName: string) => {
    // If you're trying to navigate to 'home', remove it or change it to an existing route
    // We don't need `router.push()` here in expo-router, instead, we use Link or `href`
    return <Link href={`/${screenName}`} />;
  };
  

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const translateY = useState(new Animated.Value(30))[0];
  
  // State variables
  const [weather, setWeather] = useState(null);
  const [soilMoisture, setSoilMoisture] = useState(null);
  const [rainChance, setRainChance] = useState(null);
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const t = translations[lang];

  // Get weather data from Open-Meteo API
  const fetchWeatherData = async (latitude, longitude) => {
    try {
      // Using Open-Meteo API which doesn't require an API key
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m&daily=precipitation_probability_max,precipitation_sum&hourly=soil_moisture_0_to_10cm&timezone=auto`
      );
      
      if (!response.ok) {
        throw new Error('Weather API response error');
      }
      
      const data = await response.json();
      
      // Map Open-Meteo weather code to conditions
      // https://open-meteo.com/en/docs for weather code reference
      const getWeatherCondition = (code) => {
        if (code <= 3) return 'Clear';
        if (code >= 45 && code <= 48) return 'Fog';
        if ((code >= 51 && code <= 55) || (code >= 61 && code <= 65)) return 'Rain';
        if (code >= 71 && code <= 77) return 'Snow';
        if (code >= 80 && code <= 82) return 'Rain Showers';
        if (code >= 95 && code <= 99) return 'Thunderstorm';
        return 'Cloudy';
      };
      
      setWeather({
        temp: Math.round(data.current.temperature_2m),
        condition: getWeatherCondition(data.current.weather_code),
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
      });
      
      // Use actual precipitation probability from API
      setRainChance(data.current.precipitation_probability);
      
      // Use soil moisture data from API (average of first few hours)
      // Convert from m³/m³ to percentage (multiply by 100)
      const soilMoistureAvg = data.hourly.soil_moisture_0_to_10cm
        ? data.hourly.soil_moisture_0_to_10cm.slice(0, 6).reduce((sum, val) => sum + val, 0) / 6 * 100
        : 50; // Default value if not available
      
      setSoilMoisture(Math.round(Math.max(10, Math.min(90, soilMoistureAvg))));
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching weather:', error);
      setError(t.weatherError);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Get user's current location and fetch weather data
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError(t.locationError);
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      fetchWeatherData(location.coords.latitude, location.coords.longitude);
    })();
  }, []);

  // Update translations when language changes
  useEffect(() => {
    // If we have an error message, update it to the current language
    if (error) {
      if (error === translations.en.locationError || error === translations.hi.locationError) {
        setError(t.locationError);
      } else if (error === translations.en.weatherError || error === translations.hi.weatherError) {
        setError(t.weatherError);
      }
    }
  }, [lang]);

  const toggleLanguage = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setLang(lang === 'en' ? 'hi' : 'en');
  };



  // Weather icon based on condition
  const getWeatherIcon = () => {
    if (!weather) return <MaterialCommunityIcons name="weather-cloudy" size={24} color="#FFD700" />;
    
    const condition = weather.condition.toLowerCase();
    if (condition.includes('rain')) {
      return <MaterialCommunityIcons name="weather-rainy" size={24} color="#A8D5FF" />;
    } else if (condition.includes('cloud')) {
      return <MaterialCommunityIcons name="weather-cloudy" size={24} color="#E0E0E0" />;
    } else if (condition.includes('sun') || condition.includes('clear')) {
      return <MaterialCommunityIcons name="weather-sunny" size={24} color="#FFD700" />;
    } else if (condition.includes('thunder')) {
      return <MaterialCommunityIcons name="weather-lightning" size={24} color="#FFD700" />;
    } else if (condition.includes('snow')) {
      return <MaterialCommunityIcons name="weather-snowy" size={24} color="#FFFFFF" />;
    } else if (condition.includes('fog') || condition.includes('mist')) {
      return <MaterialCommunityIcons name="weather-fog" size={24} color="#E0E0E0" />;
    } else {
      return <MaterialCommunityIcons name="weather-partly-cloudy" size={24} color="#E0E0E0" />;
    }
  };

  const getMoistureStatus = () => {
    if (!soilMoisture) return '';
    
    if (soilMoisture < 30) {
      return t.tooLow;
    } else if (soilMoisture > 60) {
      return t.wellHydrated;
    } else {
      return t.optimal;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MXx8ZmFybXxlbnwwfHwwfHw%3D&w=1000&q=80' }}
        style={styles.backgroundImage}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
          style={styles.overlay}
        >
          {/* Language toggle button - ENLARGED */}
          <TouchableOpacity 
            style={styles.languageToggle} 
            onPress={toggleLanguage}
          >
            <Text style={styles.languageText}>{t.changeLang}</Text>
            <MaterialIcons name="translate" size={32} color="#fff" style={{marginLeft: 8}} />
          </TouchableOpacity>
          
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Animated.View
              style={[
                styles.headerContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: translateY }],
                },
              ]}
            >
              <Text style={styles.welcomeText}>{t.goodMorning}</Text>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'hi-IN', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </Animated.View>

            {/* Weather Card */}
            <Animated.View
              style={[
                styles.weatherCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: translateY }],
                },
              ]}
            >
              <LinearGradient
                colors={['#4c669f', '#3b5998', '#192f6a']}
                style={styles.weatherGradient}
              >
                <View style={styles.weatherHeader}>
                  <Text style={styles.cardTitle}>{t.currentWeather}</Text>
                  {getWeatherIcon()}
                </View>
                
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#A8D5FF" />
                    <Text style={styles.loadingText}>{t.loading}</Text>
                  </View>
                ) : error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : (
                  <>
                    <View style={styles.weatherContent}>
                      <Text style={styles.temperatureText}>{weather?.temp}°C</Text>
                      <Text style={styles.conditionText}>{weather?.condition}</Text>
                    </View>
                    <View style={styles.weatherDetails}>
                      <View style={styles.weatherDetail}>
                        <Ionicons name="water-outline" size={18} color="#A8D5FF" />
                        <Text style={styles.weatherDetailText}>{t.humidity} {weather?.humidity}%</Text>
                      </View>
                      <View style={styles.weatherDetail}>
                        <Feather name="wind" size={18} color="#A8D5FF" />
                        <Text style={styles.weatherDetailText}>{t.wind} {weather?.windSpeed} {t.kmh}</Text>
                      </View>
                      <View style={styles.weatherDetail}>
                        <MaterialCommunityIcons name="weather-rainy" size={18} color="#A8D5FF" />
                        <Text style={styles.weatherDetailText}>{t.rain} {rainChance}%</Text>
                      </View>
                    </View>
                  </>
                )}
              </LinearGradient>
            </Animated.View>

            {/* Soil Moisture Card */}
            <Animated.View
              style={[
                styles.soilCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: translateY }],
                },
              ]}
            >
              <LinearGradient
                colors={['#654a86', '#534292', '#3a2e78']}
                style={styles.cardGradient}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{t.soilMoisture}</Text>
                  <MaterialCommunityIcons name="water-percent" size={24} color="#A8D5FF" />
                </View>
                
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#A8D5FF" />
                  </View>
                ) : error ? null : (
                  <>
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressBar, { width: `${soilMoisture}%` }]} />
                    </View>
                    <Text style={styles.moistureText}>{soilMoisture}% {t.moisture}</Text>
                    <Text style={styles.moistureSubText}>{getMoistureStatus()}</Text>
                  </>
                )}
              </LinearGradient>
            </Animated.View>

            {/* Features Grid */}
            <Animated.View
              style={[
                styles.featuresContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: translateY }],
                },
              ]}
            >
              
              <View style={styles.featuresContainer}>
      <Text style={styles.featuresTitle}>{t.quickActions}</Text>
      <View style={styles.featuresGrid}>
        <Link href="/scan" style={styles.featureButton}>
          <LinearGradient
            colors={['#00b09b', '#96c93d']}
            style={styles.featureGradient}
          >
            <MaterialCommunityIcons name="image-search-outline" size={32} color="#fff" />
            <Text style={styles.featureText}>{t.scanCrop}</Text>
          </LinearGradient>
        </Link>

        <Link href="/WeatherForecast" style={styles.featureButton}>
          <LinearGradient
            colors={['#FF8C00', '#FFA500']}
            style={styles.featureGradient}
          >
            <FontAwesome5 name="cloud-sun-rain" size={32} color="#fff" />
            <Text style={styles.featureText}>{t.weatherForecast}</Text>
          </LinearGradient>
        </Link>

        <Link href="/VoiceAssistant" style={styles.featureButton}>
          <LinearGradient
            colors={['#3a7bd5', '#3a6073']}
            style={styles.featureGradient}
          >
            <MaterialCommunityIcons name="microphone-outline" size={32} color="#fff" />
            <Text style={styles.featureText}>{t.voiceAssistant}</Text>
          </LinearGradient>
        </Link>

        <Link href="/WeatherSoilInfo" style={styles.featureButton}>
          <LinearGradient
            colors={['#00b09b', '#96c93d']} // Green gradient for nature/soil/weather theme
            style={styles.featureGradient}
          >
            {/* Use an icon that is more related to soil/weather */}
            <MaterialCommunityIcons name="earth" size={32} color="#fff" />  {/* Earth icon to represent soil & weather */}
            <Text style={styles.featureText}>{t.weatherSoilInfo}</Text>
          </LinearGradient>
        </Link>
      </View>
              </View>
            </Animated.View>

            {/* Tips and Advice */}
            <Animated.View
              style={[
                styles.tipsCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: translateY }],
                },
              ]}
            >
              <LinearGradient
                colors={['#2c3e50', '#4ca1af']}
                style={styles.cardGradient}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{t.todayTip}</Text>
                  <Ionicons name="bulb-outline" size={24} color="#FFD700" />
                </View>
                <Text style={styles.tipText}>{t.tipContent}</Text>
              </LinearGradient>
            </Animated.View>
          </ScrollView>

          {/* Action Button */}
          {/* <TouchableOpacity style={styles.actionButton} onPress={handleFeaturePress}>
            <LinearGradient
              colors={['#FF6B6B', '#FF8E53']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="add" size={32} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity> */}
        </LinearGradient>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  // ENLARGED language toggle button
  languageToggle: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    color: '#fff',
    fontSize: 16, // Increased font size
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  headerContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#E0E0E0',
  },
  weatherCard: {
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  weatherGradient: {
    borderRadius: 20,
    padding: 20,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  weatherContent: {
    alignItems: 'center',
    marginBottom: 15,
  },
  temperatureText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  conditionText: {
    fontSize: 18,
    color: '#E0E0E0',
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  weatherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherDetailText: {
    color: '#E0E0E0',
    marginLeft: 5,
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#E0E0E0',
    marginTop: 10,
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    padding: 10,
  },
  soilCard: {
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardGradient: {
    borderRadius: 20,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  progressContainer: {
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#A8D5FF',
    borderRadius: 7,
  },
  moistureText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  moistureSubText: {
    fontSize: 14,
    color: '#E0E0E0',
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureButton: {
    width: '48%',  // Make the buttons take up 48% of the screen width (two buttons per row)
    height: '120',  // Make the buttons take up 48% of the screen width (two buttons per row)
    marginBottom: 15, // Add space below the button
    borderRadius: 16,  // Rounded corners
    overflow: 'hidden',  // Prevent overflow of gradient from rounded corners
    elevation: 4,  // Add shadow for Android devices
    shadowColor: '#000',  // Shadow color
    shadowOffset: { width: 0, height: 2 },  // Shadow offset
    shadowOpacity: 0.25,  // Shadow opacity
    shadowRadius: 4,  // Shadow radius (blur effect)
  },
  featureGradient: {
    flex: 1,  // Ensures the gradient fills the button's area
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,  // Keep the same rounded corners
    height: '100%',  // Fill the entire button height
    width: '100%',  // Fill the entire button width
  },
  featureText: {
    color: '#ffffff',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  tipsCard: {
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tipText: {
    color: '#E0E0E0',
    fontSize: 16,
    lineHeight: 24,
  },
  // actionButton: {
  //   position: 'absolute',
  //   bottom: 30,
  //   right: 30,
  //   width: 60,
  //   height: 60,
  //   borderRadius: 30,
  //   elevation: 8,
  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: 4 },
  //   shadowOpacity: 0.3,
  //   shadowRadius: 8,
  // },
  // actionButtonGradient: {
  //   width: '100%',
  //   height: '100%',
  //   borderRadius: 30,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
});

export default HomePage;