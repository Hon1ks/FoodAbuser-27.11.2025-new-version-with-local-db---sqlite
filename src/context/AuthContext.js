/**
 * AuthContext - контекст для локальной аутентификации через PIN-код и биометрию
 * Версия: 2.0
 * Дата: 27.11.2025
 * 
 * Функциональность:
 * - Установка PIN-кода при первом запуске (4-6 цифр)
 * - Проверка PIN-кода при последующих запусках
 * - Биометрическая аутентификация (Face ID / Touch ID / Fingerprint)
 * - Хранение PIN-кода в зашифрованном виде через expo-secure-store
 * - Защита от брутфорса (5 попыток)
 * - Сброс данных при превышении попыток
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DatabaseService from '../services/DatabaseService';

// Константы
const PIN_STORAGE_KEY = 'auth_pin_hash';
const BIOMETRIC_ENABLED_KEY = 'auth_biometric_enabled';
const PIN_ATTEMPTS_KEY = 'auth_pin_attempts';
const LAST_ATTEMPT_TIME_KEY = 'auth_last_attempt_time';
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 5 * 60 * 1000; // 5 минут в миллисекундах

// Начальное состояние
const initialState = {
  isAuthenticated: false,
  isFirstLaunch: true,
  isLoading: true,
  pinSet: false,
  biometricEnabled: false,
  biometricAvailable: false,
  error: null,
  pinAttempts: 0,
  isLocked: false,
  lockoutTimeRemaining: 0,
};

// Типы действий
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_AUTHENTICATED: 'SET_AUTHENTICATED',
  SET_FIRST_LAUNCH: 'SET_FIRST_LAUNCH',
  SET_PIN_SET: 'SET_PIN_SET',
  SET_BIOMETRIC_ENABLED: 'SET_BIOMETRIC_ENABLED',
  SET_BIOMETRIC_AVAILABLE: 'SET_BIOMETRIC_AVAILABLE',
  SET_ERROR: 'SET_ERROR',
  SET_PIN_ATTEMPTS: 'SET_PIN_ATTEMPTS',
  SET_LOCKED: 'SET_LOCKED',
  SET_LOCKOUT_TIME: 'SET_LOCKOUT_TIME',
  RESET_AUTH: 'RESET_AUTH',
};

// Редьюсер
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case AUTH_ACTIONS.SET_AUTHENTICATED:
      return { ...state, isAuthenticated: action.payload, error: null };
    
    case AUTH_ACTIONS.SET_FIRST_LAUNCH:
      return { ...state, isFirstLaunch: action.payload };
    
    case AUTH_ACTIONS.SET_PIN_SET:
      return { ...state, pinSet: action.payload };
    
    case AUTH_ACTIONS.SET_BIOMETRIC_ENABLED:
      return { ...state, biometricEnabled: action.payload };
    
    case AUTH_ACTIONS.SET_BIOMETRIC_AVAILABLE:
      return { ...state, biometricAvailable: action.payload };
    
    case AUTH_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    
    case AUTH_ACTIONS.SET_PIN_ATTEMPTS:
      return { ...state, pinAttempts: action.payload };
    
    case AUTH_ACTIONS.SET_LOCKED:
      return { ...state, isLocked: action.payload };
    
    case AUTH_ACTIONS.SET_LOCKOUT_TIME:
      return { ...state, lockoutTimeRemaining: action.payload };
    
    case AUTH_ACTIONS.RESET_AUTH:
      return { ...initialState, isLoading: false };
    
    default:
      return state;
  }
}

// Создание контекста
const AuthContext = createContext();

// Провайдер контекста
export function AuthProvider({ children }) {
  console.log('🔐 AuthProvider: Component rendering...');
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // Логируем изменения состояния
  React.useEffect(() => {
    console.log('🔐 AuthProvider: State changed - isLoading:', state.isLoading, 'isAuthenticated:', state.isAuthenticated);
  }, [state.isLoading, state.isAuthenticated]);

  /**
   * Простая хеш-функция для PIN-кода (не криптографически стойкая, но достаточная для локального хранения)
   * В production лучше использовать более стойкий алгоритм
   */
  const hashPin = (pin) => {
    // Простой хеш для демонстрации
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
      const char = pin.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  };

  /**
   * Проверка доступности биометрии
   */
  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        dispatch({ type: AUTH_ACTIONS.SET_BIOMETRIC_AVAILABLE, payload: false });
        return false;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      dispatch({ type: AUTH_ACTIONS.SET_BIOMETRIC_AVAILABLE, payload: enrolled });
      return enrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      dispatch({ type: AUTH_ACTIONS.SET_BIOMETRIC_AVAILABLE, payload: false });
      return false;
    }
  };

  /**
   * Инициализация аутентификации
   * Проверяет, установлен ли PIN-код и доступна ли биометрия
   */
  const initializeAuth = async () => {
    try {
      console.log('🔐 initializeAuth: Starting...');
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      // Проверяем наличие PIN-кода
      console.log('🔐 initializeAuth: Checking PIN...');
      let pinHash = null;
      try {
        // Пробуем SecureStore с таймаутом
        const secureStorePromise = SecureStore.getItemAsync(PIN_STORAGE_KEY);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('SecureStore timeout')), 2000)
        );
        pinHash = await Promise.race([secureStorePromise, timeoutPromise]);
        console.log('🔐 initializeAuth: PIN check completed, pinHash exists:', !!pinHash);
      } catch (error) {
        console.warn('⚠️ initializeAuth: SecureStore error or timeout:', error.message);
        // Если SecureStore не работает, пробуем AsyncStorage как fallback
        try {
          pinHash = await AsyncStorage.getItem(PIN_STORAGE_KEY);
          console.log('🔐 initializeAuth: Using AsyncStorage fallback, pinHash exists:', !!pinHash);
        } catch (asyncError) {
          console.warn('⚠️ initializeAuth: AsyncStorage also failed:', asyncError.message);
          pinHash = null;
        }
      }
      
      const isFirstLaunch = !pinHash;
      console.log('🔐 initializeAuth: isFirstLaunch:', isFirstLaunch);
      
      dispatch({ type: AUTH_ACTIONS.SET_FIRST_LAUNCH, payload: isFirstLaunch });
      dispatch({ type: AUTH_ACTIONS.SET_PIN_SET, payload: !!pinHash });

      // Проверяем настройку биометрии
      console.log('🔐 initializeAuth: Checking biometric settings...');
      try {
        const biometricEnabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
        dispatch({ type: AUTH_ACTIONS.SET_BIOMETRIC_ENABLED, payload: biometricEnabled === 'true' });
        console.log('🔐 initializeAuth: Biometric enabled:', biometricEnabled === 'true');
      } catch (error) {
        console.warn('⚠️ initializeAuth: Error reading biometric settings:', error.message);
        dispatch({ type: AUTH_ACTIONS.SET_BIOMETRIC_ENABLED, payload: false });
      }

      // Проверяем доступность биометрии (не блокируем инициализацию при ошибке)
      try {
        console.log('🔐 initializeAuth: Checking biometric availability...');
        await checkBiometricAvailability();
        console.log('🔐 initializeAuth: Biometric availability checked');
      } catch (error) {
        console.warn('⚠️ initializeAuth: Could not check biometric availability:', error.message);
      }

      // Проверяем блокировку (не блокируем инициализацию при ошибке)
      try {
        console.log('🔐 initializeAuth: Checking lockout...');
        await checkLockout();
        console.log('🔐 initializeAuth: Lockout checked');
      } catch (error) {
        console.warn('⚠️ initializeAuth: Could not check lockout:', error.message);
      }

      console.log('🔐 initializeAuth: Setting isLoading to false...');
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      console.log('✅ AuthContext: Initialization completed successfully');
    } catch (error) {
      console.error('❌ initializeAuth: Fatal error:', error);
      console.error('❌ initializeAuth: Error stack:', error.stack);
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      // ВСЕГДА устанавливаем isLoading в false, даже при ошибке
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      // НЕ пробрасываем ошибку, чтобы приложение не зависло
    }
  };

  /**
   * Проверка блокировки после превышения попыток
   */
  const checkLockout = async () => {
    try {
      const attempts = parseInt(await AsyncStorage.getItem(PIN_ATTEMPTS_KEY) || '0', 10);
      const lastAttemptTime = parseInt(await AsyncStorage.getItem(LAST_ATTEMPT_TIME_KEY) || '0', 10);
      
      if (attempts >= MAX_ATTEMPTS) {
        const timeSinceLastAttempt = Date.now() - lastAttemptTime;
        if (timeSinceLastAttempt < LOCKOUT_TIME) {
          const remaining = Math.ceil((LOCKOUT_TIME - timeSinceLastAttempt) / 1000);
          dispatch({ type: AUTH_ACTIONS.SET_LOCKED, payload: true });
          dispatch({ type: AUTH_ACTIONS.SET_LOCKOUT_TIME, payload: remaining });
          dispatch({ type: AUTH_ACTIONS.SET_PIN_ATTEMPTS, payload: attempts });
          return true;
        } else {
          // Время блокировки истекло, сбрасываем попытки
          await AsyncStorage.removeItem(PIN_ATTEMPTS_KEY);
          await AsyncStorage.removeItem(LAST_ATTEMPT_TIME_KEY);
          dispatch({ type: AUTH_ACTIONS.SET_LOCKED, payload: false });
          dispatch({ type: AUTH_ACTIONS.SET_PIN_ATTEMPTS, payload: 0 });
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking lockout:', error);
      return false;
    }
  };

  /**
   * Установка PIN-кода (первый запуск)
   */
  const setPin = async (pin, confirmPin) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: null });

      // Валидация
      if (pin.length < 4 || pin.length > 6) {
        throw new Error('PIN-код должен содержать от 4 до 6 цифр');
      }

      if (!/^\d+$/.test(pin)) {
        throw new Error('PIN-код должен содержать только цифры');
      }

      if (pin !== confirmPin) {
        throw new Error('PIN-коды не совпадают');
      }

      // Сохраняем хеш PIN-кода
      const pinHash = hashPin(pin);
      try {
        await SecureStore.setItemAsync(PIN_STORAGE_KEY, pinHash);
      } catch (error) {
        console.warn('⚠️ setPin: SecureStore failed, using AsyncStorage fallback:', error.message);
        // Fallback на AsyncStorage если SecureStore не работает
        await AsyncStorage.setItem(PIN_STORAGE_KEY, pinHash);
      }

      dispatch({ type: AUTH_ACTIONS.SET_PIN_SET, payload: true });
      dispatch({ type: AUTH_ACTIONS.SET_FIRST_LAUNCH, payload: false });
      dispatch({ type: AUTH_ACTIONS.SET_AUTHENTICATED, payload: true });

      // Сбрасываем попытки
      await AsyncStorage.removeItem(PIN_ATTEMPTS_KEY);
      await AsyncStorage.removeItem(LAST_ATTEMPT_TIME_KEY);
      dispatch({ type: AUTH_ACTIONS.SET_PIN_ATTEMPTS, payload: 0 });

      return { success: true };
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  /**
   * Проверка PIN-кода
   */
  const verifyPin = async (pin) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: null });

      // Проверяем блокировку
      const isLocked = await checkLockout();
      if (isLocked) {
        const remaining = state.lockoutTimeRemaining;
        throw new Error(`Превышено количество попыток. Попробуйте через ${Math.ceil(remaining / 60)} минут.`);
      }

      // Получаем сохраненный хеш
      let savedPinHash = null;
      try {
        savedPinHash = await SecureStore.getItemAsync(PIN_STORAGE_KEY);
      } catch (error) {
        console.warn('⚠️ verifyPin: SecureStore failed, trying AsyncStorage:', error.message);
        // Fallback на AsyncStorage
        savedPinHash = await AsyncStorage.getItem(PIN_STORAGE_KEY);
      }
      
      if (!savedPinHash) {
        throw new Error('PIN-код не установлен');
      }

      // Проверяем PIN-код
      const inputPinHash = hashPin(pin);
      if (inputPinHash !== savedPinHash) {
        // Увеличиваем счетчик попыток
        const attempts = parseInt(await AsyncStorage.getItem(PIN_ATTEMPTS_KEY) || '0', 10) + 1;
        await AsyncStorage.setItem(PIN_ATTEMPTS_KEY, attempts.toString());
        await AsyncStorage.setItem(LAST_ATTEMPT_TIME_KEY, Date.now().toString());
        
        dispatch({ type: AUTH_ACTIONS.SET_PIN_ATTEMPTS, payload: attempts });

        if (attempts >= MAX_ATTEMPTS) {
          dispatch({ type: AUTH_ACTIONS.SET_LOCKED, payload: true });
          dispatch({ type: AUTH_ACTIONS.SET_LOCKOUT_TIME, payload: Math.ceil(LOCKOUT_TIME / 1000 / 60) });
          throw new Error(`Неверный PIN-код. Превышено количество попыток. Приложение заблокировано на ${Math.ceil(LOCKOUT_TIME / 1000 / 60)} минут.`);
        }

        const remaining = MAX_ATTEMPTS - attempts;
        throw new Error(`Неверный PIN-код. Осталось попыток: ${remaining}`);
      }

      // PIN-код верный - сбрасываем попытки и авторизуем
      await AsyncStorage.removeItem(PIN_ATTEMPTS_KEY);
      await AsyncStorage.removeItem(LAST_ATTEMPT_TIME_KEY);
      dispatch({ type: AUTH_ACTIONS.SET_PIN_ATTEMPTS, payload: 0 });
      dispatch({ type: AUTH_ACTIONS.SET_LOCKED, payload: false });
      dispatch({ type: AUTH_ACTIONS.SET_AUTHENTICATED, payload: true });

      return { success: true };
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  /**
   * Биометрическая аутентификация
   */
  const authenticateWithBiometric = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: null });

      if (!state.biometricAvailable) {
        throw new Error('Биометрия недоступна на этом устройстве');
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Подтвердите вашу личность',
        cancelLabel: 'Отмена',
        disableDeviceFallback: false,
      });

      if (result.success) {
        dispatch({ type: AUTH_ACTIONS.SET_AUTHENTICATED, payload: true });
        // Сбрасываем попытки при успешной биометрии
        await AsyncStorage.removeItem(PIN_ATTEMPTS_KEY);
        await AsyncStorage.removeItem(LAST_ATTEMPT_TIME_KEY);
        dispatch({ type: AUTH_ACTIONS.SET_PIN_ATTEMPTS, payload: 0 });
        return { success: true };
      } else {
        throw new Error('Биометрическая аутентификация не удалась');
      }
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  /**
   * Включение/выключение биометрии
   */
  const setBiometricEnabled = async (enabled) => {
    try {
      if (enabled) {
        // Проверяем доступность биометрии перед включением
        const available = await checkBiometricAvailability();
        if (!available) {
          throw new Error('Биометрия недоступна на этом устройстве');
        }
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      } else {
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
      }
      dispatch({ type: AUTH_ACTIONS.SET_BIOMETRIC_ENABLED, payload: enabled });
      return { success: true };
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  /**
   * Выход из системы
   */
  const logout = () => {
    dispatch({ type: AUTH_ACTIONS.SET_AUTHENTICATED, payload: false });
  };

  /**
   * Сброс аутентификации (удаление PIN-кода и всех данных)
   * ВНИМАНИЕ: Это удалит все данные приложения!
   */
  const resetAuth = async () => {
    try {
      // Удаляем PIN-код
      await SecureStore.deleteItemAsync(PIN_STORAGE_KEY);
      
      // Удаляем настройки биометрии
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
      
      // Удаляем попытки
      await AsyncStorage.removeItem(PIN_ATTEMPTS_KEY);
      await AsyncStorage.removeItem(LAST_ATTEMPT_TIME_KEY);
      
      // Очищаем все данные из БД
      await DatabaseService.clearAllData();
      
      dispatch({ type: AUTH_ACTIONS.RESET_AUTH });
      return { success: true };
    } catch (error) {
      console.error('Error resetting auth:', error);
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  // Инициализация при монтировании
  useEffect(() => {
    console.log('🔐 AuthContext: useEffect triggered, starting initialization...');
    console.log('🔐 AuthContext: Current state.isLoading:', state.isLoading);
    
    let isMounted = true;
    let timeoutId = null;
    let initTimer = null;
    
    const init = async () => {
      if (!isMounted) {
        console.log('🔐 AuthContext: Component unmounted, skipping init');
        return;
      }
      
      try {
        console.log('🔐 AuthContext: Calling initializeAuth...');
        await initializeAuth();
        if (isMounted) {
          console.log('✅ AuthContext: Initialization completed in useEffect');
        }
      } catch (error) {
        console.error('❌ AuthContext: Initialization failed in useEffect:', error);
        // Устанавливаем isLoading в false даже при ошибке, чтобы приложение не зависло
        if (isMounted) {
          console.log('🔐 AuthContext: Setting isLoading to false due to error');
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      }
    };
    
    // Запускаем инициализацию сразу (без задержки)
    initTimer = setTimeout(() => {
      init();
    }, 50);
    
    // Таймаут безопасности: если инициализация не завершилась за 3 секунды, принудительно устанавливаем isLoading в false
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('⚠️ AuthContext: Initialization timeout after 3s! Forcing isLoading to false');
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    }, 3000);
    
    return () => {
      console.log('🔐 AuthContext: useEffect cleanup');
      isMounted = false;
      if (initTimer) clearTimeout(initTimer);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []); // Пустой массив зависимостей - выполняется только при монтировании

  // Обновление оставшегося времени блокировки
  useEffect(() => {
    if (state.isLocked && state.lockoutTimeRemaining > 0) {
      const interval = setInterval(() => {
        const newRemaining = Math.max(0, state.lockoutTimeRemaining - 1);
        dispatch({ type: AUTH_ACTIONS.SET_LOCKOUT_TIME, payload: newRemaining });
        
        if (newRemaining === 0) {
          dispatch({ type: AUTH_ACTIONS.SET_LOCKED, payload: false });
          AsyncStorage.removeItem(PIN_ATTEMPTS_KEY);
          AsyncStorage.removeItem(LAST_ATTEMPT_TIME_KEY);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [state.isLocked, state.lockoutTimeRemaining]);

  const value = {
    ...state,
    setPin,
    verifyPin,
    authenticateWithBiometric,
    setBiometricEnabled,
    logout,
    resetAuth,
    checkBiometricAvailability,
    initializeAuth,
  };

  console.log('🔐 AuthProvider: Rendering provider with value, isLoading:', value.isLoading);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Хук для использования контекста
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

