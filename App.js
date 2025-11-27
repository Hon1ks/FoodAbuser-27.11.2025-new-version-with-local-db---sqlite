// Постепенное добавление компонентов
import 'react-native-gesture-handler';

import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider } from './src/context/ThemeContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { MealProvider } from './src/context/MealContext';
import { WeightProvider } from './src/context/WeightContext';
import AppNavigator from './src/navigation';
import theme from './src/theme';

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <PaperProvider theme={theme}>
          <MealProvider>
            <WeightProvider>
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
            </WeightProvider>
          </MealProvider>
        </PaperProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
} 