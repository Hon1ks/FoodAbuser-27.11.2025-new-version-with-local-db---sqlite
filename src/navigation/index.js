import * as React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import WelcomeScreen from '../screens/WelcomeScreen';
import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import AddMealScreen from '../screens/AddMealScreen';
import DiaryScreen from '../screens/DiaryScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#43cea2',
        tabBarInactiveTintColor: '#6C63FF',
        tabBarStyle: { backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, height: 77 },
        tabBarLabelStyle: { fontWeight: 'bold', fontSize: 11 },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home-variant';
          if (route.name === 'Diary') iconName = 'calendar-text';
          if (route.name === 'AddMeal') iconName = 'plus-circle';
          if (route.name === 'Analytics') iconName = 'chart-donut';
          if (route.name === 'Settings') iconName = 'cog';
          return <MaterialCommunityIcons name={iconName} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Главная' }} />
      <Tab.Screen name="Diary" component={DiaryScreen} options={{ title: 'Дневник' }} />
      <Tab.Screen name="AddMeal" component={AddMealScreen} options={{ title: 'Добавить' }} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Аналитика' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Настройки' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ isAuthenticated }) {
  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
    >
      {!isAuthenticated ? (
        // Пока пользователь не авторизован — только экран аутентификации
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        // После авторизации — основное приложение
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
        </>
      )}
    </Stack.Navigator>
  );
} 