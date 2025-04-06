import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import ScanScreen from "./scan";
import AnalysisScreen from "./analysis";
import WeatherSoilInfo from "./WeatherSoilInfo"; 
import WeatherForecastScreen from "./WeatherForecast";
import VoiceAssistantScreen from "./VoiceAssistant"; 
import HomePage from "./index"; 

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="scan">
      <Stack.Screen name="scan" component={ScanScreen} />
      <Stack.Screen name="analysis" component={AnalysisScreen} />
      <Stack.Screen name="weather" component={WeatherSoilInfo} />
      <Stack.Screen name="forecast" component={WeatherForecastScreen} /> 
      <Stack.Screen name="Assistant" component={VoiceAssistantScreen} /> 
      <Stack.Screen name="home" component={HomePage} /> 
    </Stack.Navigator>
  );
};

export default AppNavigator;
