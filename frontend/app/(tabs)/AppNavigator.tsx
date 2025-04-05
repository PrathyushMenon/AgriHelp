import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import ScanScreen from "./scan";
import AnalysisScreen from "./analysis";
import WeatherSoilInfo from "./WeatherSoilInfo"; // ✅ Existing weather info screen
import WeatherForecastScreen from "./WeatherForecast"; // ✅ New Weather Forecast Screen
import VoiceAssistantScreen from "./VoiceAssistant"; // ✅ New Weather Forecast Screen
import HomePage from "./index"; // ✅ New Weather Forecast Screen

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="scan">
      <Stack.Screen name="scan" component={ScanScreen} />
      <Stack.Screen name="analysis" component={AnalysisScreen} />
      <Stack.Screen name="weather" component={WeatherSoilInfo} />
      <Stack.Screen name="forecast" component={WeatherForecastScreen} /> {/* ✅ New Forecast Screen */}
      <Stack.Screen name="Assistant" component={VoiceAssistantScreen} /> 
      <Stack.Screen name="home" component={HomePage} /> 
    </Stack.Navigator>
  );
};

export default AppNavigator;
