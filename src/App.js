// react-native-gesture-handler должен быть импортирован первым
import 'react-native-gesture-handler';

import * as React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation';
import theme from './theme';
import { MealProvider } from './context/MealContext';
import { WeightProvider } from './context/WeightContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';

// TODO: добавить провайдеры для локализации и аутентификации

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