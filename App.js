import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { getColors, setCurrentTheme } from './utils/themes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// Import screens
import CollectionScreen from './screens/Collection';
import InventoryScreen from './screens/Inventory';
import BoxingScreen from './screens/Boxing';
import SalesScreen from './screens/Sales';
import SettingsScreen from './screens/Settings';

const Tab = createBottomTabNavigator();

export default function App() {
  const [colors, setColors] = useState(getColors());

  useEffect(() => {
    loadThemeSettings();

    // Set up interval to check for theme changes every second
    const themeCheckInterval = setInterval(() => {
      const currentColors = getColors();
      setColors(currentColors);
    }, 1000);

    return () => clearInterval(themeCheckInterval);
  }, []);

  const loadThemeSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('selected_theme');
      const savedDarkMode = await AsyncStorage.getItem('dark_mode');

      if (savedTheme) {
        const isDarkMode = savedDarkMode ? JSON.parse(savedDarkMode) : false;
        const newColors = setCurrentTheme(savedTheme, isDarkMode);
        setColors(newColors);
      }
    } catch (error) {
      console.error('Error loading theme settings:', error);
    }
  };

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Collection') {
              iconName = focused ? 'basket' : 'basket-outline';
            } else if (route.name === 'Inventory') {
              iconName = focused ? 'list' : 'list-outline';
            } else if (route.name === 'Boxing') {
              iconName = focused ? 'cube' : 'cube-outline';
            } else if (route.name === 'Sales') {
              iconName = focused ? 'cash' : 'cash-outline';
            } else if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textLight,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen
          name="Collection"
          component={CollectionScreen}
          options={{ title: 'Collect', tabBarLabel: 'Collect' }}
        />
        <Tab.Screen
          name="Inventory"
          component={InventoryScreen}
          options={{ title: 'Inventory', tabBarLabel: 'Inventory' }}
        />
        <Tab.Screen
          name="Boxing"
          component={BoxingScreen}
          options={{ title: 'Pack', tabBarLabel: 'Pack' }}
        />
        <Tab.Screen
          name="Sales"
          component={SalesScreen}
          options={{ title: 'Sales', tabBarLabel: 'Sales' }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings', tabBarLabel: 'Settings' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
