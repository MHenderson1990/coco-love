import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import TodayScreen from '../screens/TodayScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SavedScreen from '../screens/SavedScreen';
import WatchScreen from '../screens/WatchScreen';
import ProfileScreen from '../screens/ProfileScreen';

let Tab = createBottomTabNavigator();

let ICONS = {
  Today: 'sunny-outline',
  History: 'time-outline',
  Saved: 'heart-outline',
  Watch: 'play-circle-outline',
  You: 'person-outline',
};

export default function TabNavigator() {
  let { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          paddingTop: 6,
          height: 88,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} size={size - 2} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Saved" component={SavedScreen} />
      <Tab.Screen name="Watch" component={WatchScreen} />
      <Tab.Screen name="You" component={ProfileScreen} />
    </Tab.Navigator>
  );
}