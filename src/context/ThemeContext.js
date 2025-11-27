import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Начальное состояние
const initialState = {
  isDarkMode: false,
  loading: false,
  error: null,
};

// Типы действий
const THEME_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_DARK_MODE: 'SET_DARK_MODE',
  SET_ERROR: 'SET_ERROR',
  LOAD_THEME: 'LOAD_THEME',
};

// Редьюсер
function themeReducer(state, action) {
  switch (action.type) {
    case THEME_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case THEME_ACTIONS.SET_DARK_MODE:
      return { 
        ...state, 
        isDarkMode: action.payload,
        loading: false,
        error: null 
      };
    
    case THEME_ACTIONS.SET_ERROR:
      return { 
        ...state, 
        error: action.payload,
        loading: false 
      };
    
    case THEME_ACTIONS.LOAD_THEME:
      return { 
        ...state, 
        isDarkMode: action.payload,
        loading: false,
        error: null 
      };
    
    default:
      return state;
  }
}

// Создание контекста
const ThemeContext = createContext();

// Провайдер контекста
export function ThemeProvider({ children }) {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  // Функции для работы с темой
  const actions = {
    // Переключение темы
    toggleTheme: async () => {
      dispatch({ type: THEME_ACTIONS.SET_LOADING, payload: true });
      try {
        const newTheme = !state.isDarkMode;
        await AsyncStorage.setItem('isDarkMode', JSON.stringify(newTheme));
        dispatch({ type: THEME_ACTIONS.SET_DARK_MODE, payload: newTheme });
      } catch (error) {
        dispatch({ type: THEME_ACTIONS.SET_ERROR, payload: error.message });
      }
    },

    // Установка конкретной темы
    setTheme: async (isDark) => {
      dispatch({ type: THEME_ACTIONS.SET_LOADING, payload: true });
      try {
        await AsyncStorage.setItem('isDarkMode', JSON.stringify(isDark));
        dispatch({ type: THEME_ACTIONS.SET_DARK_MODE, payload: isDark });
      } catch (error) {
        dispatch({ type: THEME_ACTIONS.SET_ERROR, payload: error.message });
      }
    },

    // Загрузка сохраненной темы
    loadTheme: async () => {
      dispatch({ type: THEME_ACTIONS.SET_LOADING, payload: true });
      try {
        const savedTheme = await AsyncStorage.getItem('isDarkMode');
        if (savedTheme !== null) {
          const isDark = JSON.parse(savedTheme);
          dispatch({ type: THEME_ACTIONS.LOAD_THEME, payload: isDark });
        } else {
          // По умолчанию светлая тема
          dispatch({ type: THEME_ACTIONS.LOAD_THEME, payload: false });
        }
      } catch (error) {
        dispatch({ type: THEME_ACTIONS.SET_ERROR, payload: error.message });
        // В случае ошибки используем светлую тему по умолчанию
        dispatch({ type: THEME_ACTIONS.LOAD_THEME, payload: false });
      }
    }
  };

  // Загрузка темы при монтировании (с задержкой для избежания конфликтов)
  useEffect(() => {
    // Небольшая задержка для избежания одновременного доступа к AsyncStorage
    const timer = setTimeout(() => {
      actions.loadTheme().catch(err => {
        console.warn('Failed to load theme:', err);
      });
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  const value = {
    ...state,
    ...actions,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Хук для использования контекста
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}


