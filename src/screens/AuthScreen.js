/**
 * AuthScreen - экран аутентификации через PIN-код и биометрию
 * Версия: 2.0
 * Дата: 27.11.2025
 * 
 * Функциональность:
 * - Установка PIN-кода при первом запуске (4-6 цифр, с подтверждением)
 * - Ввод PIN-кода при последующих запусках
 * - Биометрическая аутентификация (если доступна и включена)
 * - Обработка блокировки после 5 неверных попыток
 * - Опция сброса данных (с предупреждением)
 */

import * as React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Animated, Dimensions, Alert } from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText, Surface, Portal, Modal } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const MAX_ATTEMPTS = 5; // Максимальное количество попыток ввода PIN-кода

export default function AuthScreen() {
  const theme = useTheme();
  const navigation = useNavigation();

  // Контекст аутентификации (AuthProvider гарантированно оборачивает приложение)
  const authContext = useAuth();

  const {
    isFirstLaunch,
    isLoading,
    pinSet,
    biometricEnabled,
    biometricAvailable,
    error,
    pinAttempts,
    isLocked,
    lockoutTimeRemaining,
    setPin,
    verifyPin,
    authenticateWithBiometric,
    setBiometricEnabled,
    resetAuth,
    checkBiometricAvailability,
  } = authContext;

  // Состояние для установки PIN-кода
  const [pin, setPinValue] = React.useState('');
  const [confirmPin, setConfirmPin] = React.useState('');
  const [showPin, setShowPin] = React.useState(false);
  const [showConfirmPin, setShowConfirmPin] = React.useState(false);
  const [step, setStep] = React.useState(1); // 1 - ввод PIN, 2 - подтверждение PIN
  const [localError, setLocalError] = React.useState('');
  const [anim] = React.useState(new Animated.Value(0));
  const [showResetModal, setShowResetModal] = React.useState(false);

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Проверяем доступность биометрии при загрузке
  React.useEffect(() => {
    if (!isFirstLaunch && biometricAvailable && biometricEnabled) {
      // Автоматически предлагаем биометрию при загрузке
      handleBiometricAuth();
    }
  }, [isFirstLaunch, biometricAvailable, biometricEnabled]);

  // Обработка установки PIN-кода
  const handleSetPin = async () => {
    setLocalError('');
    
    if (step === 1) {
      // Валидация первого PIN-кода
      if (pin.length < 4 || pin.length > 6) {
        setLocalError('PIN-код должен содержать от 4 до 6 цифр');
        return;
      }
      if (!/^\d+$/.test(pin)) {
        setLocalError('PIN-код должен содержать только цифры');
        return;
      }
      // Переходим к подтверждению
      setStep(2);
    } else {
      // Устанавливаем PIN-код
      const result = await setPin(pin, confirmPin);
      if (result.success) {
        // После установки PIN предлагаем биометрию
        if (biometricAvailable) {
          Alert.alert(
            'Биометрическая аутентификация',
            'Хотите включить биометрическую аутентификацию (Face ID / Touch ID)?',
            [
              { text: 'Нет', style: 'cancel' },
              {
                text: 'Да',
                onPress: async () => {
                  await setBiometricEnabled(true);
                },
              },
            ]
          );
        }
      } else {
        setLocalError(result.error || 'Ошибка при установке PIN-кода');
      }
    }
  };

  // Обработка проверки PIN-кода
  const handleVerifyPin = async () => {
    setLocalError('');
    const result = await verifyPin(pin);
    if (!result.success) {
      setLocalError(result.error || 'Неверный PIN-код');
      setPinValue(''); // Очищаем поле при ошибке
    }
  };

  // Обработка биометрической аутентификации
  const handleBiometricAuth = async () => {
    setLocalError('');
    const result = await authenticateWithBiometric();
    if (!result.success) {
      setLocalError(result.error || 'Биометрическая аутентификация не удалась');
    }
  };

  // Обработка сброса данных
  const handleReset = () => {
    Alert.alert(
      '⚠️ ВНИМАНИЕ!',
      'Это действие удалит ВСЕ данные приложения, включая:\n\n' +
      '• Все записи о приемах пищи\n' +
      '• Все записи веса\n' +
      '• Все записи воды\n' +
      '• Все настройки\n' +
      '• PIN-код\n\n' +
      'Это действие нельзя отменить!',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить все данные',
          style: 'destructive',
          onPress: async () => {
            const result = await resetAuth();
            if (result.success) {
              setShowResetModal(false);
              setStep(1);
              setPinValue('');
              setConfirmPin('');
            } else {
              setLocalError(result.error || 'Ошибка при сбросе данных');
            }
          },
        },
      ]
    );
  };

  // Форматирование времени блокировки
  const formatLockoutTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <View style={styles.flex}>
        <LinearGradient
          colors={["#1230c7de", "#000000", "#15c712de"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <LinearGradient
        colors={["#1230c7de", "#000000", "#15c712de"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
        }}>
          <Surface style={styles.surface} elevation={4}>
            {/* Заголовок */}
            <View style={styles.header}>
              <MaterialCommunityIcons name="lock" size={48} color="#43cea2" />
              <Text style={styles.title}>
                {isFirstLaunch ? 'Установка PIN-кода' : 'Введите PIN-код'}
              </Text>
              <Text style={styles.subtitle}>
                {isFirstLaunch
                  ? 'Создайте PIN-код для защиты ваших данных'
                  : 'Введите PIN-код для входа в приложение'}
              </Text>
            </View>

            {/* Блокировка */}
            {isLocked && (
              <View style={styles.lockoutContainer}>
                <MaterialCommunityIcons name="lock-alert" size={32} color="#ff6b6b" />
                <Text style={styles.lockoutText}>
                  Приложение заблокировано
                </Text>
                <Text style={styles.lockoutTime}>
                  Попробуйте через: {formatLockoutTime(lockoutTimeRemaining)}
                </Text>
              </View>
            )}

            {/* Поля ввода PIN */}
            {!isLocked && (
              <>
                <TextInput
                  label={isFirstLaunch && step === 1 ? "PIN-код (4-6 цифр)" : step === 2 ? "Подтвердите PIN-код" : "PIN-код"}
                  value={isFirstLaunch && step === 2 ? confirmPin : pin}
                  onChangeText={(text) => {
                    // Разрешаем только цифры
                    const numericText = text.replace(/[^0-9]/g, '');
                    if (isFirstLaunch && step === 2) {
                      setConfirmPin(numericText);
                    } else {
                      setPinValue(numericText);
                    }
                    setLocalError('');
                  }}
                  keyboardType="numeric"
                  secureTextEntry={isFirstLaunch && step === 2 ? !showConfirmPin : !showPin}
                  maxLength={6}
                  style={styles.input}
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={isFirstLaunch && step === 2 ? (showConfirmPin ? 'eye-off' : 'eye') : (showPin ? 'eye-off' : 'eye')}
                      onPress={() => {
                        if (isFirstLaunch && step === 2) {
                          setShowConfirmPin(!showConfirmPin);
                        } else {
                          setShowPin(!showPin);
                        }
                      }}
                    />
                  }
                  error={!!(localError || error)}
                  disabled={isLocked}
                  autoFocus
                />

                {/* Ошибки */}
                {(localError || error) && (
                  <HelperText type="error" visible style={styles.errorText}>
                    {localError || error}
                  </HelperText>
                )}

                {/* Счетчик попыток */}
                {!isFirstLaunch && pinAttempts > 0 && pinAttempts < MAX_ATTEMPTS && (
                  <Text style={styles.attemptsText}>
                    Осталось попыток: {MAX_ATTEMPTS - pinAttempts}
                  </Text>
                )}

                {/* Кнопка подтверждения */}
                <Button
                  mode="contained"
                  style={styles.submitBtn}
                  onPress={isFirstLaunch ? handleSetPin : handleVerifyPin}
                  contentStyle={{ height: 48 }}
                  labelStyle={{ fontWeight: 'bold', fontSize: 17 }}
                  disabled={
                    isLocked ||
                    (isFirstLaunch && step === 1 && pin.length < 4) ||
                    (isFirstLaunch && step === 2 && confirmPin.length < 4) ||
                    (!isFirstLaunch && pin.length < 4)
                  }
                >
                  {isFirstLaunch
                    ? step === 1
                      ? 'Продолжить'
                      : 'Установить PIN-код'
                    : 'Войти'}
                </Button>

                {/* Кнопка биометрии */}
                {!isFirstLaunch && biometricAvailable && biometricEnabled && (
                  <Button
                    mode="outlined"
                    style={styles.biometricBtn}
                    onPress={handleBiometricAuth}
                    icon="fingerprint"
                    contentStyle={{ height: 48 }}
                  >
                    Войти с биометрией
                  </Button>
                )}

                {/* Кнопка сброса (только если не первый запуск и есть попытки) */}
                {!isFirstLaunch && pinAttempts >= 3 && (
                  <Button
                    mode="text"
                    style={styles.resetBtn}
                    onPress={() => setShowResetModal(true)}
                    textColor="#ff6b6b"
                  >
                    Сбросить данные
                  </Button>
                )}
              </>
            )}
          </Surface>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Модальное окно подтверждения сброса */}
      <Portal>
        <Modal
          visible={showResetModal}
          onDismiss={() => setShowResetModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Сброс данных</Text>
          <Text style={styles.modalText}>
            Вы уверены, что хотите удалить все данные и сбросить PIN-код?
            Это действие нельзя отменить.
          </Text>
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowResetModal(false)}
              style={styles.modalButton}
            >
              Отмена
            </Button>
            <Button
              mode="contained"
              onPress={handleReset}
              style={[styles.modalButton, { backgroundColor: '#ff6b6b' }]}
            >
              Удалить
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  surface: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    marginBottom: 12,
    backgroundColor: '#f6f6fa',
  },
  errorText: {
    marginBottom: 8,
    textAlign: 'center',
  },
  attemptsText: {
    fontSize: 14,
    color: '#ff9800',
    marginBottom: 8,
    fontWeight: '600',
  },
  submitBtn: {
    width: '100%',
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: '#43cea2',
  },
  biometricBtn: {
    width: '100%',
    marginTop: 12,
    borderRadius: 16,
    borderColor: '#6C63FF',
  },
  resetBtn: {
    marginTop: 16,
  },
  lockoutContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  lockoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginTop: 8,
  },
  lockoutTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginTop: 4,
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 24,
    margin: 20,
    borderRadius: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});
