import { ActivityIndicator, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import TabNavigator from './src/navigation/TabNavigator';
import AdminScreen from './src/screens/AdminScreen';
import AnnouncementsScreen from './src/screens/AnnouncementsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import UpgradeScreen from './src/screens/UpgradeScreen';
import VideoPlayerScreen from './src/screens/VideoPlayerScreen';
import ManageVideosScreen from './src/screens/ManageVideosScreen';
import ManageAffirmationsScreen from './src/screens/ManageAffirmationsScreen';
import ThemedBackground from './src/components/ThemedBackground';
import RewardScreen from './src/screens/RewardScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import SavedScreen from './src/screens/SavedScreen';
import { useFonts, Lora_400Regular, Lora_400Regular_Italic, Lora_700Bold } from '@expo-google-fonts/lora';

let Stack = createNativeStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function Root() {
  let { user, loading } = useAuth();
  let { colors } = useTheme();
  let [fontsLoaded] = useFonts({ Lora_400Regular, Lora_400Regular_Italic, Lora_700Bold });

  if (loading || !fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <ThemedBackground>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
          {user ? (
            <>
              <Stack.Screen name="Main" component={TabNavigator} />
              <Stack.Screen name="Admin" component={AdminScreen} />
              <Stack.Screen name="Announcements" component={AnnouncementsScreen} />
              <Stack.Screen name="History" component={HistoryScreen} />
              <Stack.Screen name="Upgrade" component={UpgradeScreen} />
              <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
              <Stack.Screen name="ManageVideos" component={ManageVideosScreen} />
              <Stack.Screen name="ManageAffirmations" component={ManageAffirmationsScreen} />
              <Stack.Screen name="Reward" component={RewardScreen} />
              <Stack.Screen name="Saved" component={SavedScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
              <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ThemedBackground>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <Root />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}