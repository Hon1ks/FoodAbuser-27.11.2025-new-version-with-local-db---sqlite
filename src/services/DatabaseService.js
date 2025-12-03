/**
 * DatabaseService - сервис для работы с локальной SQLite базой данных
 * Версия: 2.0
 * Дата: 27.11.2025
 * 
 * Этот сервис предоставляет все CRUD операции для работы с данными приложения:
 * - meals (приемы пищи)
 * - water_records (записи воды)
 * - weight_records (записи веса)
 * - user_settings (настройки пользователя)
 * - users (профили пользователей - для будущего использования)
 */

import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// Имя базы данных
const DB_NAME = 'foodabuser.db';

// Экземпляр базы данных (singleton)
let db = null;
let isWeb = Platform.OS === 'web';

/**
 * Инициализация базы данных
 * Создает все необходимые таблицы, если они не существуют
 * На веб-платформе SQLite не поддерживается, поэтому пропускаем инициализацию
 * @returns {Promise<SQLite.SQLiteDatabase|null>} Экземпляр базы данных или null на веб
 */
export async function initDB() {
  try {
    // На веб-платформе SQLite не работает, пропускаем инициализацию
    if (isWeb) {
      console.log('⚠️ Database: SQLite not available on web platform, using AsyncStorage only');
      return null;
    }

    // Открываем/создаем базу данных
    // В Expo SDK 53 используется openDatabaseAsync
    db = await SQLite.openDatabaseAsync(DB_NAME);
    
    // Включаем foreign keys
    await db.execAsync('PRAGMA foreign_keys = ON;');
    
    // Создаем таблицы
    await createTables();
    
    console.log('✅ Database initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    // На веб или при ошибке продолжаем работу без SQLite
    if (isWeb) {
      console.log('⚠️ Database: Continuing without SQLite on web platform');
      return null;
    }
    throw error;
  }
}

/**
 * Создание всех таблиц базы данных
 * @returns {Promise<void>}
 */
async function createTables() {
  try {
    // Таблица пользователей (для будущего использования)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        avatar_url TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Таблица приемов пищи
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS meals (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        portion_weight INTEGER,
        calories INTEGER,
        protein REAL,
        fat REAL,
        carbs REAL,
        image_url TEXT,
        meal_time TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Таблица записей воды
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS water_records (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        amount_ml INTEGER NOT NULL,
        record_date TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Таблица записей веса
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS weight_records (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        weight_kg REAL NOT NULL,
        record_date TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Таблица настроек пользователя
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        daily_calorie_goal INTEGER DEFAULT 2000,
        daily_water_goal_ml INTEGER DEFAULT 2000,
        target_weight_kg REAL,
        initial_weight_kg REAL,
        notifications_enabled INTEGER DEFAULT 1,
        dark_mode INTEGER DEFAULT 0,
        language TEXT DEFAULT 'ru',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Создаем индексы для оптимизации запросов
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_meals_meal_time ON meals(meal_time);
      CREATE INDEX IF NOT EXISTS idx_meals_category ON meals(category);
      CREATE INDEX IF NOT EXISTS idx_water_records_date ON water_records(record_date);
      CREATE INDEX IF NOT EXISTS idx_weight_records_date ON weight_records(record_date);
    `);

    console.log('✅ Tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
}

/**
 * Получение экземпляра базы данных
 * Если БД не инициализирована, инициализирует её
 * На веб возвращает null
 * @returns {Promise<SQLite.SQLiteDatabase|null>}
 */
async function getDB() {
  if (isWeb) {
    return null; // На веб SQLite не доступен
  }
  if (!db) {
    await initDB();
  }
  return db;
}

// ==================== MEALS (Приемы пищи) ====================

/**
 * Загрузка всех приемов пищи за период
 * @param {string} period - Период: 'day', 'week', 'month', '3m', '6m', 'year'
 * @param {string} userId - ID пользователя (опционально)
 * @returns {Promise<Array>} Массив приемов пищи
 */
export async function loadMeals(period = 'week', userId = null) {
  try {
    const database = await getDB();
    // На веб SQLite не доступен, возвращаем пустой массив
    if (!database) {
      console.log('⚠️ loadMeals: SQLite not available, returning empty array');
      return [];
    }
    const now = new Date();
    let startDate = new Date();

    // Определяем начальную дату в зависимости от периода
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3m':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    const startDateStr = startDate.toISOString();
    let query = 'SELECT * FROM meals WHERE meal_time >= ?';
    const params = [startDateStr];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY meal_time DESC';

    const result = await database.getAllAsync(query, params);
    
    // Преобразуем данные в нужный формат
    return result.map(row => ({
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      description: row.description,
      category: row.category,
      portion_weight: row.portion_weight,
      calories: row.calories || 0,
      protein: row.protein || 0,
      fat: row.fat || 0,
      carbs: row.carbs || 0,
      image_url: row.image_url,
      meal_time: row.meal_time,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  } catch (error) {
    console.error('❌ Error loading meals:', error);
    throw error;
  }
}

/**
 * Добавление нового приема пищи
 * @param {Object} mealData - Данные приема пищи
 * @returns {Promise<Object>} Созданный прием пищи
 */
export async function addMeal(mealData) {
  try {
    const database = await getDB();
    // На веб SQLite не доступен, возвращаем данные как есть
    if (!database) {
      console.log('⚠️ addMeal: SQLite not available, returning mealData as is');
      return {
        id: mealData.id || `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...mealData,
        created_at: mealData.created_at || new Date().toISOString(),
        updated_at: mealData.updated_at || new Date().toISOString(),
      };
    }
    const id = mealData.id || `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const query = `
      INSERT INTO meals (
        id, user_id, title, description, category, portion_weight,
        calories, protein, fat, carbs, image_url, meal_time, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await database.runAsync(query, [
      id,
      mealData.user_id || null,
      mealData.title || '',
      mealData.description || null,
      mealData.category || 'snack',
      mealData.portion_weight || null,
      mealData.calories || 0,
      mealData.protein || 0,
      mealData.fat || 0,
      mealData.carbs || 0,
      mealData.image_url || null,
      mealData.meal_time || now,
      now,
      now,
    ]);

    // Получаем созданную запись
    const result = await database.getFirstAsync('SELECT * FROM meals WHERE id = ?', [id]);
    
    return {
      id: result.id,
      user_id: result.user_id,
      title: result.title,
      description: result.description,
      category: result.category,
      portion_weight: result.portion_weight,
      calories: result.calories || 0,
      protein: result.protein || 0,
      fat: result.fat || 0,
      carbs: result.carbs || 0,
      image_url: result.image_url,
      meal_time: result.meal_time,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  } catch (error) {
    console.error('❌ Error adding meal:', error);
    throw error;
  }
}

/**
 * Обновление приема пищи
 * @param {Object} mealData - Данные приема пищи с id
 * @returns {Promise<Object>} Обновленный прием пищи
 */
export async function updateMeal(mealData) {
  try {
    const database = await getDB();
    // На веб SQLite не доступен, возвращаем данные как есть
    if (!database) {
      console.log('⚠️ updateMeal: SQLite not available, returning mealData as is');
      return {
        ...mealData,
        updated_at: new Date().toISOString(),
      };
    }
    const now = new Date().toISOString();

    const query = `
      UPDATE meals SET
        title = ?,
        description = ?,
        category = ?,
        portion_weight = ?,
        calories = ?,
        protein = ?,
        fat = ?,
        carbs = ?,
        image_url = ?,
        meal_time = ?,
        updated_at = ?
      WHERE id = ?
    `;

    await database.runAsync(query, [
      mealData.title || '',
      mealData.description || null,
      mealData.category || 'snack',
      mealData.portion_weight || null,
      mealData.calories || 0,
      mealData.protein || 0,
      mealData.fat || 0,
      mealData.carbs || 0,
      mealData.image_url || null,
      mealData.meal_time || now,
      now,
      mealData.id,
    ]);

    // Получаем обновленную запись
    const result = await database.getFirstAsync('SELECT * FROM meals WHERE id = ?', [mealData.id]);
    
    return {
      id: result.id,
      user_id: result.user_id,
      title: result.title,
      description: result.description,
      category: result.category,
      portion_weight: result.portion_weight,
      calories: result.calories || 0,
      protein: result.protein || 0,
      fat: result.fat || 0,
      carbs: result.carbs || 0,
      image_url: result.image_url,
      meal_time: result.meal_time,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  } catch (error) {
    console.error('❌ Error updating meal:', error);
    throw error;
  }
}

/**
 * Удаление приема пищи
 * @param {string} mealId - ID приема пищи
 * @returns {Promise<boolean>} true если успешно удалено
 */
export async function deleteMeal(mealId) {
  try {
    const database = await getDB();
    // На веб SQLite не доступен, просто возвращаем true
    if (!database) {
      console.log('⚠️ deleteMeal: SQLite not available, returning true');
      return true;
    }
    await database.runAsync('DELETE FROM meals WHERE id = ?', [mealId]);
    return true;
  } catch (error) {
    console.error('❌ Error deleting meal:', error);
    throw error;
  }
}

// ==================== WATER RECORDS (Записи воды) ====================

/**
 * Загрузка записей воды за период
 * @param {string} period - Период: 'day', 'week', 'month', '3m', '6m', 'year'
 * @param {string} userId - ID пользователя (опционально)
 * @returns {Promise<Array>} Массив записей воды
 */
export async function loadWaterRecords(period = 'week', userId = null) {
  try {
    const database = await getDB();
    if (!database) {
      console.log('⚠️ loadWaterRecords: SQLite not available, returning empty array');
      return [];
    }
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3m':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    let query = 'SELECT * FROM water_records WHERE record_date >= ?';
    const params = [startDateStr];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY record_date DESC';

    const result = await database.getAllAsync(query, params);
    
    return result.map(row => ({
      id: row.id,
      user_id: row.user_id,
      amount_ml: row.amount_ml,
      record_date: row.record_date,
      created_at: row.created_at,
    }));
  } catch (error) {
    console.error('❌ Error loading water records:', error);
    throw error;
  }
}

/**
 * Добавление записи воды
 * @param {Object} waterData - Данные записи воды
 * @returns {Promise<Object>} Созданная запись
 */
export async function addWaterRecord(waterData) {
  try {
    const database = await getDB();
    if (!database) {
      const id = waterData.id || `water_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      const recordDate = waterData.record_date || new Date().toISOString().split('T')[0];
      return {
        id,
        user_id: waterData.user_id || null,
        amount_ml: waterData.amount_ml || 0,
        record_date: recordDate,
        created_at: now,
      };
    }
    const id = waterData.id || `water_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const recordDate = waterData.record_date || new Date().toISOString().split('T')[0];

    const query = `
      INSERT INTO water_records (id, user_id, amount_ml, record_date, created_at)
      VALUES (?, ?, ?, ?, ?)
    `;

    await database.runAsync(query, [
      id,
      waterData.user_id || null,
      waterData.amount_ml || 0,
      recordDate,
      now,
    ]);

    const result = await database.getFirstAsync('SELECT * FROM water_records WHERE id = ?', [id]);
    
    return {
      id: result.id,
      user_id: result.user_id,
      amount_ml: result.amount_ml,
      record_date: result.record_date,
      created_at: result.created_at,
    };
  } catch (error) {
    console.error('❌ Error adding water record:', error);
    throw error;
  }
}

/**
 * Обновление записи воды
 * @param {Object} waterData - Данные записи с id
 * @returns {Promise<Object>} Обновленная запись
 */
export async function updateWaterRecord(waterData) {
  try {
    const database = await getDB();
    if (!database) {
      return {
        ...waterData,
        created_at: waterData.created_at || new Date().toISOString(),
      };
    }

    const query = `
      UPDATE water_records SET
        amount_ml = ?,
        record_date = ?
      WHERE id = ?
    `;

    await database.runAsync(query, [
      waterData.amount_ml || 0,
      waterData.record_date,
      waterData.id,
    ]);

    const result = await database.getFirstAsync('SELECT * FROM water_records WHERE id = ?', [waterData.id]);
    
    return {
      id: result.id,
      user_id: result.user_id,
      amount_ml: result.amount_ml,
      record_date: result.record_date,
      created_at: result.created_at,
    };
  } catch (error) {
    console.error('❌ Error updating water record:', error);
    throw error;
  }
}

/**
 * Удаление записи воды
 * @param {string} recordId - ID записи
 * @returns {Promise<boolean>} true если успешно удалено
 */
export async function deleteWaterRecord(recordId) {
  try {
    const database = await getDB();
    if (!database) {
      return true;
    }
    await database.runAsync('DELETE FROM water_records WHERE id = ?', [recordId]);
    return true;
  } catch (error) {
    console.error('❌ Error deleting water record:', error);
    throw error;
  }
}

// ==================== WEIGHT RECORDS (Записи веса) ====================

/**
 * Загрузка записей веса за период
 * @param {string} period - Период: 'day', 'week', 'month', '3m', '6m', 'year'
 * @param {string} userId - ID пользователя (опционально)
 * @returns {Promise<Array>} Массив записей веса
 */
export async function loadWeightRecords(period = 'month', userId = null) {
  try {
    const database = await getDB();
    if (!database) {
      console.log('⚠️ loadWeightRecords: SQLite not available, returning empty array');
      return [];
    }
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3m':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    let query = 'SELECT * FROM weight_records WHERE record_date >= ?';
    const params = [startDateStr];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY record_date DESC';

    const result = await database.getAllAsync(query, params);
    
    return result.map(row => ({
      id: row.id,
      user_id: row.user_id,
      weight: row.weight_kg,
      weight_kg: row.weight_kg,
      record_date: row.record_date,
      created_at: row.created_at,
    }));
  } catch (error) {
    console.error('❌ Error loading weight records:', error);
    throw error;
  }
}

/**
 * Добавление записи веса
 * @param {Object} weightData - Данные записи веса
 * @returns {Promise<Object>} Созданная запись
 */
export async function addWeightRecord(weightData) {
  try {
    const database = await getDB();
    if (!database) {
      const id = weightData.id || `weight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      const recordDate = weightData.record_date || new Date().toISOString().split('T')[0];
      const weight = parseFloat(weightData.weight || weightData.weight_kg || 0);
      return {
        id,
        user_id: weightData.user_id || null,
        weight,
        weight_kg: weight,
        record_date: recordDate,
        created_at: now,
      };
    }
    const id = weightData.id || `weight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const recordDate = weightData.record_date || new Date().toISOString().split('T')[0];
    const weight = parseFloat(weightData.weight || weightData.weight_kg || 0);

    const query = `
      INSERT INTO weight_records (id, user_id, weight_kg, record_date, created_at)
      VALUES (?, ?, ?, ?, ?)
    `;

    await database.runAsync(query, [
      id,
      weightData.user_id || null,
      weight,
      recordDate,
      now,
    ]);

    const result = await database.getFirstAsync('SELECT * FROM weight_records WHERE id = ?', [id]);
    
    return {
      id: result.id,
      user_id: result.user_id,
      weight: result.weight_kg,
      weight_kg: result.weight_kg,
      record_date: result.record_date,
      created_at: result.created_at,
    };
  } catch (error) {
    console.error('❌ Error adding weight record:', error);
    throw error;
  }
}

/**
 * Обновление записи веса
 * @param {Object} weightData - Данные записи с id
 * @returns {Promise<Object>} Обновленная запись
 */
export async function updateWeightRecord(weightData) {
  try {
    const database = await getDB();
    if (!database) {
      const weight = parseFloat(weightData.weight || weightData.weight_kg || 0);
      return {
        ...weightData,
        weight,
        weight_kg: weight,
        created_at: weightData.created_at || new Date().toISOString(),
      };
    }
    const weight = parseFloat(weightData.weight || weightData.weight_kg || 0);

    const query = `
      UPDATE weight_records SET
        weight_kg = ?,
        record_date = ?
      WHERE id = ?
    `;

    await database.runAsync(query, [
      weight,
      weightData.record_date,
      weightData.id,
    ]);

    const result = await database.getFirstAsync('SELECT * FROM weight_records WHERE id = ?', [weightData.id]);
    
    return {
      id: result.id,
      user_id: result.user_id,
      weight: result.weight_kg,
      weight_kg: result.weight_kg,
      record_date: result.record_date,
      created_at: result.created_at,
    };
  } catch (error) {
    console.error('❌ Error updating weight record:', error);
    throw error;
  }
}

/**
 * Удаление записи веса
 * @param {string} recordId - ID записи
 * @returns {Promise<boolean>} true если успешно удалено
 */
export async function deleteWeightRecord(recordId) {
  try {
    const database = await getDB();
    if (!database) {
      return true;
    }
    await database.runAsync('DELETE FROM weight_records WHERE id = ?', [recordId]);
    return true;
  } catch (error) {
    console.error('❌ Error deleting weight record:', error);
    throw error;
  }
}

// ==================== EXPORT/IMPORT ====================

/**
 * Экспорт всех данных в JSON
 * @returns {Promise<Object>} Объект со всеми данными
 */
export async function exportAllData() {
  try {
    const database = await getDB();
    
    const meals = await database.getAllAsync('SELECT * FROM meals ORDER BY meal_time DESC');
    const waterRecords = await database.getAllAsync('SELECT * FROM water_records ORDER BY record_date DESC');
    const weightRecords = await database.getAllAsync('SELECT * FROM weight_records ORDER BY record_date DESC');
    const settings = await database.getAllAsync('SELECT * FROM user_settings');

    return {
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      data: {
        meals: meals.map(row => ({
          id: row.id,
          user_id: row.user_id,
          title: row.title,
          description: row.description,
          category: row.category,
          portion_weight: row.portion_weight,
          calories: row.calories,
          protein: row.protein,
          fat: row.fat,
          carbs: row.carbs,
          image_url: row.image_url,
          meal_time: row.meal_time,
          created_at: row.created_at,
          updated_at: row.updated_at,
        })),
        water_records: waterRecords.map(row => ({
          id: row.id,
          user_id: row.user_id,
          amount_ml: row.amount_ml,
          record_date: row.record_date,
          created_at: row.created_at,
        })),
        weight_records: weightRecords.map(row => ({
          id: row.id,
          user_id: row.user_id,
          weight_kg: row.weight_kg,
          record_date: row.record_date,
          created_at: row.created_at,
        })),
        user_settings: settings.map(row => ({
          id: row.id,
          user_id: row.user_id,
          daily_calorie_goal: row.daily_calorie_goal,
          daily_water_goal_ml: row.daily_water_goal_ml,
          target_weight_kg: row.target_weight_kg,
          initial_weight_kg: row.initial_weight_kg,
          notifications_enabled: row.notifications_enabled,
          dark_mode: row.dark_mode,
          language: row.language,
          created_at: row.created_at,
          updated_at: row.updated_at,
        })),
      },
    };
  } catch (error) {
    console.error('❌ Error exporting data:', error);
    throw error;
  }
}

/**
 * Импорт данных из JSON
 * @param {Object} importData - Данные для импорта
 * @param {boolean} overwrite - Перезаписать существующие данные
 * @returns {Promise<boolean>} true если успешно импортировано
 */
export async function importAllData(importData, overwrite = false) {
  try {
    const database = await getDB();
    
    // Начинаем транзакцию
    await database.withTransactionAsync(async () => {
      if (overwrite) {
        // Удаляем все существующие данные
        await database.execAsync('DELETE FROM meals');
        await database.execAsync('DELETE FROM water_records');
        await database.execAsync('DELETE FROM weight_records');
        await database.execAsync('DELETE FROM user_settings');
      }

      // Импортируем meals
      if (importData.data?.meals) {
        for (const meal of importData.data.meals) {
          await addMeal(meal);
        }
      }

      // Импортируем water_records
      if (importData.data?.water_records) {
        for (const record of importData.data.water_records) {
          await addWaterRecord(record);
        }
      }

      // Импортируем weight_records
      if (importData.data?.weight_records) {
        for (const record of importData.data.weight_records) {
          await addWeightRecord(record);
        }
      }

      // Импортируем user_settings
      if (importData.data?.user_settings) {
        for (const setting of importData.data.user_settings) {
          const query = `
            INSERT OR REPLACE INTO user_settings (
              id, user_id, daily_calorie_goal, daily_water_goal_ml,
              target_weight_kg, initial_weight_kg, notifications_enabled,
              dark_mode, language, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          await database.runAsync(query, [
            setting.id,
            setting.user_id || null,
            setting.daily_calorie_goal || 2000,
            setting.daily_water_goal_ml || 2000,
            setting.target_weight_kg || null,
            setting.initial_weight_kg || null,
            setting.notifications_enabled !== undefined ? setting.notifications_enabled : 1,
            setting.dark_mode !== undefined ? setting.dark_mode : 0,
            setting.language || 'ru',
            setting.created_at || new Date().toISOString(),
            setting.updated_at || new Date().toISOString(),
          ]);
        }
      }
    });

    return true;
  } catch (error) {
    console.error('❌ Error importing data:', error);
    throw error;
  }
}

/**
 * Очистка всех данных (для сброса приложения)
 * @returns {Promise<boolean>} true если успешно очищено
 */
export async function clearAllData() {
  try {
    const database = await getDB();
    
    await database.execAsync('DELETE FROM meals');
    await database.execAsync('DELETE FROM water_records');
    await database.execAsync('DELETE FROM weight_records');
    await database.execAsync('DELETE FROM user_settings');
    await database.execAsync('DELETE FROM users');
    
    return true;
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
}

