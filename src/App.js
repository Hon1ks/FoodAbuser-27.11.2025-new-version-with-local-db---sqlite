// react-native-gesture-handler должен быть импортирован первым
import 'react-native-gesture-handler';

import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation';
import theme from './theme';
import { MealProvider } from './context/MealContext';
import { WeightProvider } from './context/WeightContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import * as DatabaseService from './services/DatabaseService';

// DONE 27.11.2025: Добавлен AuthProvider для локальной аутентификации через PIN-код и биометрию
// TODO: добавить провайдеры для локализации

// Компонент для условной навигации в зависимости от статуса аутентификации
function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [dbInitialized, setDbInitialized] = React.useState(false);
  
  // Логирование для отладки
  React.useEffect(() => {
    console.log('📱 AppContent: Render - isLoading:', isLoading, 'dbInitialized:', dbInitialized, 'isAuthenticated:', isAuthenticated);
  }, [isLoading, dbInitialized, isAuthenticated]);

  // Инициализация базы данных при первом запуске
  // DONE 27.11.2025: Добавлена инициализация локальной SQLite БД
  // На веб-платформе SQLite не работает, поэтому продолжаем без него
  React.useEffect(() => {
    const initDatabase = async () => {
      try {
        await DatabaseService.initDB();
        setDbInitialized(true);
        console.log('✅ App: Database initialization completed');
      } catch (error) {
        console.error('❌ App: Error initializing database:', error);
        // Продолжаем работу даже при ошибке инициализации
        // На веб это нормально, так как SQLite не поддерживается
        setDbInitialized(true);
      }
    };

    initDatabase();
  }, []);

  // Показываем приложение только после инициализации БД и проверки аутентификации
  if (!dbInitialized || isLoading) {
    // Экран загрузки
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Загрузка...</Text>
        <Text style={styles.loadingSubtext}>
          {!dbInitialized ? 'Инициализация базы данных...' : 'Проверка аутентификации...'}
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AppNavigator isAuthenticated={isAuthenticated} />
    </NavigationContainer>
  );
}

export default function App() {
  // DONE 27.11.2025: Исправлен порядок провайдеров
  // AuthProvider должен быть самым внешним, чтобы все компоненты имели доступ к контексту
  return (
    <AuthProvider>
      <ThemeProvider>
        <SettingsProvider>
          <PaperProvider theme={theme}>
            <MealProvider>
              <WeightProvider>
                <AppContent />
              </WeightProvider>
            </MealProvider>
          </PaperProvider>
        </SettingsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  loadingSubtext: {
    color: '#999',
    fontSize: 14,
  },
}); 