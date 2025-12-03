/**
 * CameraService - сервис для работы с камерой и галереей
 * Версия: 2.0
 * Дата: 02.12.2025
 * 
 * Функциональность:
 * - Захват фото с камеры
 * - Выбор фото из галереи
 * - Проверка разрешений
 * - Оптимизация изображений
 */

import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

/**
 * Проверяет и запрашивает разрешения для камеры
 * @returns {Promise<boolean>} true если разрешение получено
 */
export async function requestCameraPermissions() {
  try {
    console.log('📷 CameraService: Requesting camera permissions...');
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Требуется разрешение',
        'Для использования камеры необходимо разрешение. Пожалуйста, включите его в настройках приложения.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    console.log('✅ CameraService: Camera permissions granted');
    return true;
  } catch (error) {
    console.error('❌ CameraService: Error requesting camera permissions:', error);
    return false;
  }
}

/**
 * Проверяет и запрашивает разрешения для галереи
 * @returns {Promise<boolean>} true если разрешение получено
 */
export async function requestGalleryPermissions() {
  try {
    console.log('🖼️ CameraService: Requesting gallery permissions...');
    
    // На iOS 11+ не требуется явное разрешение для галереи
    if (Platform.OS === 'ios' && Platform.Version >= 11) {
      console.log('✅ CameraService: Gallery permissions not required on iOS 11+');
      return true;
    }
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Требуется разрешение',
        'Для доступа к галерее необходимо разрешение. Пожалуйста, включите его в настройках приложения.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    console.log('✅ CameraService: Gallery permissions granted');
    return true;
  } catch (error) {
    console.error('❌ CameraService: Error requesting gallery permissions:', error);
    return false;
  }
}

/**
 * Открывает камеру для съемки фото
 * @returns {Promise<Object|null>} Объект с данными фото или null при отмене
 */
export async function takePhoto() {
  try {
    console.log('📷 CameraService: Opening camera...');
    
    // Проверяем разрешения
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) {
      return null;
    }
    
    // Открываем камеру
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      exif: false, // Не включаем EXIF данные для приватности
    });
    
    if (result.canceled) {
      console.log('📷 CameraService: User cancelled camera');
      return null;
    }
    
    console.log('✅ CameraService: Photo taken successfully');
    return {
      uri: result.assets[0].uri,
      width: result.assets[0].width,
      height: result.assets[0].height,
    };
  } catch (error) {
    console.error('❌ CameraService: Error taking photo:', error);
    Alert.alert(
      'Ошибка',
      'Не удалось сделать фото. Пожалуйста, попробуйте еще раз.',
      [{ text: 'OK' }]
    );
    return null;
  }
}

/**
 * Открывает галерею для выбора фото
 * @returns {Promise<Object|null>} Объект с данными фото или null при отмене
 */
export async function pickImageFromGallery() {
  try {
    console.log('🖼️ CameraService: Opening gallery...');
    
    // Проверяем разрешения
    const hasPermission = await requestGalleryPermissions();
    if (!hasPermission) {
      return null;
    }
    
    // Открываем галерею
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      exif: false, // Не включаем EXIF данные для приватности
    });
    
    if (result.canceled) {
      console.log('🖼️ CameraService: User cancelled gallery');
      return null;
    }
    
    console.log('✅ CameraService: Image selected successfully');
    return {
      uri: result.assets[0].uri,
      width: result.assets[0].width,
      height: result.assets[0].height,
    };
  } catch (error) {
    console.error('❌ CameraService: Error picking image:', error);
    Alert.alert(
      'Ошибка',
      'Не удалось выбрать фото. Пожалуйста, попробуйте еще раз.',
      [{ text: 'OK' }]
    );
    return null;
  }
}

/**
 * Проверяет доступность камеры на устройстве
 * @returns {Promise<boolean>} true если камера доступна
 */
export async function isCameraAvailable() {
  try {
    if (Platform.OS === 'web') {
      // На веб-платформе камера может быть недоступна
      return false;
    }
    
    const permissions = await ImagePicker.getCameraPermissionsAsync();
    return permissions.canAskAgain || permissions.granted;
  } catch (error) {
    console.error('❌ CameraService: Error checking camera availability:', error);
    return false;
  }
}

/**
 * Проверяет доступность галереи на устройстве
 * @returns {Promise<boolean>} true если галерея доступна
 */
export async function isGalleryAvailable() {
  try {
    const permissions = await ImagePicker.getMediaLibraryPermissionsAsync();
    return permissions.canAskAgain || permissions.granted;
  } catch (error) {
    console.error('❌ CameraService: Error checking gallery availability:', error);
    return true; // По умолчанию считаем доступной
  }
}

