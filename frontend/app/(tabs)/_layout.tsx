import { Tabs,useRouter  } from "expo-router";
import { useColorScheme } from "react-native";
import { 
  Home as HomeIcon, 
  Camera, 
  Leaf, 
  BarChart2, 
  MessageSquare, 
  CloudRain, 
  Sun 
} from "lucide-react-native"; 
import Icon from 'react-native-vector-icons/FontAwesome';

export default function TabLayout() {
  const theme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme === "dark" ? "#1E1E1E" : "#ffffff",
          borderTopWidth: 1,
          borderTopColor: theme === "dark" ? "#333" : "#f1f1f1",
        },
        tabBarActiveTintColor: "#2F9E44",
        tabBarInactiveTintColor: "#868E96",
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ size, color }) => <HomeIcon size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ size, color }) => <Camera size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: "Analysis",
          tabBarIcon: ({ size, color }) => <Leaf size={size} color={color} />,
        }}
      />
      {/* <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ size, color }) => <BarChart2 size={size} color={color} />,
        }}
      /> */}
      {/* <Tabs.Screen
        name="advisory"
        options={{
          title: "Advisory",
          tabBarIcon: ({ size, color }) => <MessageSquare size={size} color={color} />,
        }}
      /> */}
      <Tabs.Screen
        name="WeatherSoilInfo"
        options={{
          title: "Weather",
          tabBarIcon: ({ size, color }) => <CloudRain size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="WeatherForecast" // ✅ New Tab for Forecast
        options={{
          title: "Forecast",
          tabBarIcon: ({ size, color }) => <Sun size={size} color={color} />, // ☀️ Sun icon for forecast
        }}
      />
      <Tabs.Screen
        name="VoiceAssistant" // New Tab for Voice Speech Thing
        options={{
          title: "Assistant",
          tabBarIcon: ({ size, color }) => <Icon name="microphone" size={size} color={color} />, // 🎤 Microphone icon for voice assistant
        }}
      />
    </Tabs>
  );
}
