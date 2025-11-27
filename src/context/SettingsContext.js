import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Ленивая загрузка для избежания проблем при инициализации
// import * as FileSystem from 'expo-file-system';
// import * as Sharing from 'expo-sharing';

// Начальное состояние
const initialState = {
  notifications: {
    enabled: true,
    mealReminders: true,
    waterReminders: true,
    weightReminders: false,
    mealTimes: {
      breakfast: { enabled: true, time: '08:00' },
      lunch: { enabled: true, time: '13:00' },
      dinner: { enabled: true, time: '19:00' },
    }
  },
  goals: {
    dailyCalories: 2000,
    dailyWater: 2000, // в мл
    targetWeight: 65,
    initialWeight: 70,
  },
  privacy: {
    dataSharing: false,
    analytics: true,
  },
  loading: false,
  error: null,
};

// Типы действий
const SETTINGS_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  SET_GOALS: 'SET_GOALS',
  SET_PRIVACY: 'SET_PRIVACY',
  SET_ERROR: 'SET_ERROR',
  LOAD_SETTINGS: 'LOAD_SETTINGS',
  UPDATE_NOTIFICATION_SETTING: 'UPDATE_NOTIFICATION_SETTING',
  UPDATE_GOAL: 'UPDATE_GOAL',
  UPDATE_PRIVACY_SETTING: 'UPDATE_PRIVACY_SETTING',
};

// Редьюсер
function settingsReducer(state, action) {
  switch (action.type) {
    case SETTINGS_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case SETTINGS_ACTIONS.SET_NOTIFICATIONS:
      return { 
        ...state, 
        notifications: action.payload,
        loading: false,
        error: null 
      };
    
    case SETTINGS_ACTIONS.SET_GOALS:
      return { 
        ...state, 
        goals: action.payload,
        loading: false,
        error: null 
      };
    
    case SETTINGS_ACTIONS.SET_PRIVACY:
      return { 
        ...state, 
        privacy: action.payload,
        loading: false,
        error: null 
      };
    
    case SETTINGS_ACTIONS.SET_ERROR:
      return { 
        ...state, 
        error: action.payload,
        loading: false 
      };
    
    case SETTINGS_ACTIONS.LOAD_SETTINGS:
      return { 
        ...state, 
        ...action.payload,
        loading: false,
        error: null 
      };
    
    case SETTINGS_ACTIONS.UPDATE_NOTIFICATION_SETTING:
      return {
        ...state,
        notifications: {
          ...state.notifications,
          [action.payload.key]: action.payload.value
        },
        loading: false
      };
    
    case SETTINGS_ACTIONS.UPDATE_GOAL:
      return {
        ...state,
        goals: {
          ...state.goals,
          [action.payload.key]: action.payload.value
        },
        loading: false
      };
    
    case SETTINGS_ACTIONS.UPDATE_PRIVACY_SETTING:
      return {
        ...state,
        privacy: {
          ...state.privacy,
          [action.payload.key]: action.payload.value
        },
        loading: false
      };
    
    default:
      return state;
  }
}

// Создание контекста
const SettingsContext = createContext();

// Провайдер контекста
export function SettingsProvider({ children }) {
  const [state, dispatch] = useReducer(settingsReducer, initialState);

  // Функции для работы с настройками
  const actions = {
    // Загрузка настроек
    loadSettings: async () => {
      dispatch({ type: SETTINGS_ACTIONS.SET_LOADING, payload: true });
      try {
        const savedSettings = await AsyncStorage.getItem('userSettings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          dispatch({ type: SETTINGS_ACTIONS.LOAD_SETTINGS, payload: settings });
        } else {
          // Сохраняем настройки по умолчанию
          await AsyncStorage.setItem('userSettings', JSON.stringify(initialState));
          dispatch({ type: SETTINGS_ACTIONS.LOAD_SETTINGS, payload: initialState });
        }
      } catch (error) {
        dispatch({ type: SETTINGS_ACTIONS.SET_ERROR, payload: error.message });
      }
    },

    // Сохранение настроек
    saveSettings: async (settings) => {
      dispatch({ type: SETTINGS_ACTIONS.SET_LOADING, payload: true });
      try {
        await AsyncStorage.setItem('userSettings', JSON.stringify(settings));
        dispatch({ type: SETTINGS_ACTIONS.LOAD_SETTINGS, payload: settings });
      } catch (error) {
        dispatch({ type: SETTINGS_ACTIONS.SET_ERROR, payload: error.message });
      }
    },

    // Обновление настройки уведомлений
    updateNotificationSetting: async (key, value) => {
      dispatch({ type: SETTINGS_ACTIONS.SET_LOADING, payload: true });
      try {
        const newNotifications = { ...state.notifications, [key]: value };
        const newSettings = { ...state, notifications: newNotifications };
        await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
        dispatch({ type: SETTINGS_ACTIONS.UPDATE_NOTIFICATION_SETTING, payload: { key, value } });
      } catch (error) {
        dispatch({ type: SETTINGS_ACTIONS.SET_ERROR, payload: error.message });
      }
    },

    // Обновление цели
    updateGoal: async (key, value) => {
      dispatch({ type: SETTINGS_ACTIONS.SET_LOADING, payload: true });
      try {
        const newGoals = { ...state.goals, [key]: value };
        const newSettings = { ...state, goals: newGoals };
        await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
        dispatch({ type: SETTINGS_ACTIONS.UPDATE_GOAL, payload: { key, value } });
      } catch (error) {
        dispatch({ type: SETTINGS_ACTIONS.SET_ERROR, payload: error.message });
      }
    },

    // Обновление настройки приватности
    updatePrivacySetting: async (key, value) => {
      dispatch({ type: SETTINGS_ACTIONS.SET_LOADING, payload: true });
      try {
        const newPrivacy = { ...state.privacy, [key]: value };
        const newSettings = { ...state, privacy: newPrivacy };
        await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
        dispatch({ type: SETTINGS_ACTIONS.UPDATE_PRIVACY_SETTING, payload: { key, value } });
      } catch (error) {
        dispatch({ type: SETTINGS_ACTIONS.SET_ERROR, payload: error.message });
      }
    },

    // Экспорт данных
    exportData: async () => {
      dispatch({ type: SETTINGS_ACTIONS.SET_LOADING, payload: true });
      try {
        // Ленивая загрузка модулей
        const FileSystem = await import('expo-file-system');
        const Sharing = await import('expo-sharing');
        
        // Получаем все данные из AsyncStorage
        const keys = await AsyncStorage.getAllKeys();
        const data = await AsyncStorage.multiGet(keys);
        
        const exportData = {
          settings: state,
          appData: Object.fromEntries(data),
          exportDate: new Date().toISOString(),
          version: '1.0.0'
        };

        // Создаем файл
        const fileName = `foodabuser_backup_${new Date().toISOString().split('T')[0]}.json`;
        const fileUri = FileSystem.default.documentDirectory + fileName;
        
        await FileSystem.default.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2));
        
        // Предлагаем поделиться файлом
        if (await Sharing.default.isAvailableAsync()) {
          await Sharing.default.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Экспорт данных FoodAbuser'
          });
        }
        
        dispatch({ type: SETTINGS_ACTIONS.SET_LOADING, payload: false });
        return { success: true, fileUri };
      } catch (error) {
        dispatch({ type: SETTINGS_ACTIONS.SET_ERROR, payload: error.message });
        return { success: false, error: error.message };
      }
    },

    // Импорт данных
    importData: async (fileUri) => {
      dispatch({ type: SETTINGS_ACTIONS.SET_LOADING, payload: true });
      try {
        // Ленивая загрузка модулей
        const FileSystem = await import('expo-file-system');
        
        const fileContent = await FileSystem.default.readAsStringAsync(fileUri);
        const importData = JSON.parse(fileContent);
        
        // Валидация данных
        if (!importData.settings || !importData.appData) {
          throw new Error('Неверный формат файла');
        }
        
        // Восстанавливаем настройки
        await AsyncStorage.setItem('userSettings', JSON.stringify(importData.settings));
        
        // Восстанавливаем данные приложения
        const entries = Object.entries(importData.appData);
        await AsyncStorage.multiSet(entries);
        
        dispatch({ type: SETTINGS_ACTIONS.LOAD_SETTINGS, payload: importData.settings });
        
        return { success: true };
      } catch (error) {
        dispatch({ type: SETTINGS_ACTIONS.SET_ERROR, payload: error.message });
        return { success: false, error: error.message };
      }
    },

    // Сброс настроек
    resetSettings: async () => {
      dispatch({ type: SETTINGS_ACTIONS.SET_LOADING, payload: true });
      try {
        await AsyncStorage.setItem('userSettings', JSON.stringify(initialState));
        dispatch({ type: SETTINGS_ACTIONS.LOAD_SETTINGS, payload: initialState });
        return { success: true };
      } catch (error) {
        dispatch({ type: SETTINGS_ACTIONS.SET_ERROR, payload: error.message });
        return { success: false, error: error.message };
      }
    }
  };

  // Загрузка настроек при монтировании (с задержкой для избежания конфликтов)
  useEffect(() => {
    // Небольшая задержка для избежания одновременного доступа к AsyncStorage
    const timer = setTimeout(() => {
      actions.loadSettings().catch(err => {
        console.warn('Failed to load settings:', err);
      });
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const value = {
    ...state,
    ...actions,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// Хук для использования контекста
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
