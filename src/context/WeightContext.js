import React, { createContext, useContext, useReducer, useEffect } from 'react';
import * as DatabaseService from '../services/DatabaseService';

// Начальное состояние
const initialState = {
  weightRecords: [],
  currentWeight: 70,
  targetWeight: 65,
  initialWeight: 75,
  loading: false,
  error: null,
  stats: {
    weightChange: 0,
    progressPercentage: 0,
    averageWeight: 0,
  }
};

// Типы действий
const WEIGHT_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_WEIGHT_RECORDS: 'SET_WEIGHT_RECORDS',
  ADD_WEIGHT_RECORD: 'ADD_WEIGHT_RECORD',
  UPDATE_WEIGHT_RECORD: 'UPDATE_WEIGHT_RECORD',
  DELETE_WEIGHT_RECORD: 'DELETE_WEIGHT_RECORD',
  SET_CURRENT_WEIGHT: 'SET_CURRENT_WEIGHT',
  SET_TARGET_WEIGHT: 'SET_TARGET_WEIGHT',
  SET_INITIAL_WEIGHT: 'SET_INITIAL_WEIGHT',
  SET_ERROR: 'SET_ERROR',
  CALCULATE_STATS: 'CALCULATE_STATS',
};

// Редьюсер
function weightReducer(state, action) {
  switch (action.type) {
    case WEIGHT_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case WEIGHT_ACTIONS.SET_WEIGHT_RECORDS:
      return { 
        ...state, 
        weightRecords: action.payload,
        loading: false,
        error: null 
      };
    
    case WEIGHT_ACTIONS.ADD_WEIGHT_RECORD:
      const newRecords = [...state.weightRecords, action.payload];
      return { 
        ...state, 
        weightRecords: newRecords,
        currentWeight: action.payload.weight,
        loading: false 
      };
    
    case WEIGHT_ACTIONS.UPDATE_WEIGHT_RECORD:
      const updatedRecords = state.weightRecords.map(record => 
        record.id === action.payload.id ? action.payload : record
      );
      return { 
        ...state, 
        weightRecords: updatedRecords,
        loading: false 
      };
    
    case WEIGHT_ACTIONS.DELETE_WEIGHT_RECORD:
      const filteredRecords = state.weightRecords.filter(record => record.id !== action.payload);
      return { 
        ...state, 
        weightRecords: filteredRecords,
        loading: false 
      };
    
    case WEIGHT_ACTIONS.SET_CURRENT_WEIGHT:
      return { ...state, currentWeight: action.payload };
    
    case WEIGHT_ACTIONS.SET_TARGET_WEIGHT:
      return { ...state, targetWeight: action.payload };
    
    case WEIGHT_ACTIONS.SET_INITIAL_WEIGHT:
      return { ...state, initialWeight: action.payload };
    
    case WEIGHT_ACTIONS.SET_ERROR:
      return { 
        ...state, 
        error: action.payload,
        loading: false 
      };
    
    case WEIGHT_ACTIONS.CALCULATE_STATS:
      return { 
        ...state, 
        stats: action.payload 
      };
    
    default:
      return state;
  }
}

// Создание контекста
const WeightContext = createContext();

// Провайдер контекста
export function WeightProvider({ children }) {
  const [state, dispatch] = useReducer(weightReducer, initialState);

  // Функции для работы с данными
  const actions = {
    // Загрузка записей веса
    // DONE 27.11.2025: Заменено на запрос к локальной SQLite БД через DatabaseService
    loadWeightRecords: async (period = 'month') => {
      dispatch({ type: WEIGHT_ACTIONS.SET_LOADING, payload: true });
      try {
        const records = await DatabaseService.loadWeightRecords(period);
        dispatch({ type: WEIGHT_ACTIONS.SET_WEIGHT_RECORDS, payload: records });
        calculateStats(records);
        
        // Устанавливаем текущий вес (последняя запись)
        if (records.length > 0) {
          const sortedRecords = [...records].sort((a, b) => new Date(b.record_date) - new Date(a.record_date));
          dispatch({ type: WEIGHT_ACTIONS.SET_CURRENT_WEIGHT, payload: sortedRecords[0].weight });
        }
      } catch (error) {
        console.error('Error loading weight records:', error);
        dispatch({ type: WEIGHT_ACTIONS.SET_ERROR, payload: error.message });
      }
    },

    // Добавление записи веса
    // DONE 27.11.2025: Заменено на сохранение в локальную SQLite БД через DatabaseService
    addWeightRecord: async (weightData) => {
      dispatch({ type: WEIGHT_ACTIONS.SET_LOADING, payload: true });
      try {
        const newRecord = await DatabaseService.addWeightRecord(weightData);
        dispatch({ type: WEIGHT_ACTIONS.ADD_WEIGHT_RECORD, payload: newRecord });
        dispatch({ type: WEIGHT_ACTIONS.SET_CURRENT_WEIGHT, payload: newRecord.weight });
        calculateStats([...state.weightRecords, newRecord]);
      } catch (error) {
        console.error('Error adding weight record:', error);
        dispatch({ type: WEIGHT_ACTIONS.SET_ERROR, payload: error.message });
      }
    },

    // Обновление записи веса
    // DONE 27.11.2025: Заменено на обновление в локальной SQLite БД через DatabaseService
    updateWeightRecord: async (recordData) => {
      dispatch({ type: WEIGHT_ACTIONS.SET_LOADING, payload: true });
      try {
        const updatedRecord = await DatabaseService.updateWeightRecord(recordData);
        dispatch({ type: WEIGHT_ACTIONS.UPDATE_WEIGHT_RECORD, payload: updatedRecord });
        calculateStats(state.weightRecords.map(record => 
          record.id === updatedRecord.id ? updatedRecord : record
        ));
      } catch (error) {
        console.error('Error updating weight record:', error);
        dispatch({ type: WEIGHT_ACTIONS.SET_ERROR, payload: error.message });
      }
    },

    // Удаление записи веса
    // DONE 27.11.2025: Заменено на удаление из локальной SQLite БД через DatabaseService
    deleteWeightRecord: async (recordId) => {
      dispatch({ type: WEIGHT_ACTIONS.SET_LOADING, payload: true });
      try {
        await DatabaseService.deleteWeightRecord(recordId);
        const filteredRecords = state.weightRecords.filter(record => record.id !== recordId);
        dispatch({ type: WEIGHT_ACTIONS.DELETE_WEIGHT_RECORD, payload: recordId });
        
        // Обновляем текущий вес (последняя запись)
        if (filteredRecords.length > 0) {
          const sortedRecords = [...filteredRecords].sort((a, b) => new Date(b.record_date) - new Date(a.record_date));
          dispatch({ type: WEIGHT_ACTIONS.SET_CURRENT_WEIGHT, payload: sortedRecords[0].weight });
        }
        
        calculateStats(filteredRecords);
      } catch (error) {
        console.error('Error deleting weight record:', error);
        dispatch({ type: WEIGHT_ACTIONS.SET_ERROR, payload: error.message });
      }
    },

    // Установка целевого веса
    setTargetWeight: (weight) => {
      dispatch({ type: WEIGHT_ACTIONS.SET_TARGET_WEIGHT, payload: parseFloat(weight) });
      calculateStats(state.weightRecords);
    },

    // Установка начального веса
    setInitialWeight: (weight) => {
      dispatch({ type: WEIGHT_ACTIONS.SET_INITIAL_WEIGHT, payload: parseFloat(weight) });
      calculateStats(state.weightRecords);
    },

    // Получение данных для графика
    getChartData: (period) => {
      return generateWeightChartData(state.weightRecords, period);
    },

    // Получение рекомендаций
    getRecommendations: () => {
      return generateWeightRecommendations(state.stats, state.currentWeight, state.targetWeight);
    }
  };

  // Функция расчета статистики
  const calculateStats = (records) => {
    if (records.length === 0) {
      dispatch({ 
        type: WEIGHT_ACTIONS.CALCULATE_STATS, 
        payload: {
          weightChange: 0,
          progressPercentage: 0,
          averageWeight: state.currentWeight,
        }
      });
      return;
    }

    // Сортируем записи по дате
    const sortedRecords = [...records].sort((a, b) => new Date(a.record_date) - new Date(b.record_date));
    
    // Текущий вес (последняя запись)
    const currentWeight = sortedRecords[sortedRecords.length - 1].weight;
    
    // Изменение веса от начального
    const weightChange = currentWeight - state.initialWeight;
    
    // Прогресс к цели
    const totalChange = Math.abs(state.initialWeight - state.targetWeight);
    const currentChange = Math.abs(state.initialWeight - currentWeight);
    const progressPercentage = totalChange > 0 ? Math.min((currentChange / totalChange) * 100, 100) : 0;
    
    // Средний вес
    const averageWeight = records.reduce((sum, record) => sum + record.weight, 0) / records.length;

    const stats = {
      weightChange,
      progressPercentage,
      averageWeight,
    };

    dispatch({ 
      type: WEIGHT_ACTIONS.CALCULATE_STATS, 
      payload: stats 
    });
  };

  // Загрузка данных при монтировании (с задержкой)
  useEffect(() => {
    const timer = setTimeout(() => {
      actions.loadWeightRecords('month').catch(err => {
        console.warn('Failed to load weight records:', err);
      });
    }, 150);
    
    return () => clearTimeout(timer);
  }, []);

  const value = {
    ...state,
    ...actions,
  };

  return (
    <WeightContext.Provider value={value}>
      {children}
    </WeightContext.Provider>
  );
}

// Хук для использования контекста
export function useWeight() {
  const context = useContext(WeightContext);
  if (!context) {
    throw new Error('useWeight must be used within a WeightProvider');
  }
  return context;
}

// Вспомогательные функции для генерации моковых данных
// DONE 27.11.2025: Функция оставлена для тестирования, но больше не используется в production
// Данные теперь загружаются из локальной SQLite БД через DatabaseService
function generateMockWeightRecords(period) {
  const records = [];
  const now = new Date();
  
  // Генерируем данные в зависимости от периода
  let daysBack = 30; // по умолчанию месяц
  if (period === 'day') daysBack = 1;
  else if (period === 'week') daysBack = 7;
  else if (period === '3m') daysBack = 90;
  else if (period === '6m') daysBack = 180;
  else if (period === 'year') daysBack = 365;

  let currentWeight = 80; // начальный вес
  
  for (let i = daysBack; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Небольшие колебания веса
    const weightChange = (Math.random() - 0.5) * 0.5; // ±0.25 кг
    currentWeight += weightChange;
    
    // Записываем вес не каждый день (примерно 3-4 раза в неделю)
    if (Math.random() > 0.4) {
      records.push({
        id: `weight_${date.toISOString().split('T')[0]}`,
        weight: Math.round(currentWeight * 10) / 10, // округляем до 0.1
        record_date: date.toISOString().split('T')[0],
        created_at: date.toISOString(),
      });
    }
  }
  
  return records.sort((a, b) => new Date(a.record_date) - new Date(b.record_date));
}

function generateWeightChartData(records, period) {
  if (records.length === 0) {
    return { labels: [], datasets: [{ data: [] }] };
  }

  let labels = [];
  let data = [];
  
  if (period === 'day') {
    // Для дня показываем последние 24 часа
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayRecords = records.filter(record => 
      new Date(record.record_date) >= dayStart
    );
    
    labels = dayRecords.map(record => {
      const date = new Date(record.record_date);
      return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    });
    data = dayRecords.map(record => record.weight);
  } else if (period === 'week') {
    // Группируем по дням недели
    const weeklyData = {};
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    
    records.forEach(record => {
      const day = new Date(record.record_date).getDay();
      if (!weeklyData[day] || new Date(record.record_date) > new Date(weeklyData[day].record_date)) {
        weeklyData[day] = record;
      }
    });
    
    labels = dayNames;
    data = dayNames.map((_, index) => weeklyData[index]?.weight || 0);
  } else if (period === 'month') {
    // Группируем по дням месяца
    const monthlyData = {};
    records.forEach(record => {
      const day = new Date(record.record_date).getDate();
      if (!monthlyData[day] || new Date(record.record_date) > new Date(monthlyData[day].record_date)) {
        monthlyData[day] = record;
      }
    });
    
    labels = Object.keys(monthlyData).sort((a, b) => a - b);
    data = Object.keys(monthlyData).sort((a, b) => a - b).map(day => monthlyData[day].weight);
  } else if (period === '3m') {
    // Группируем по неделям
    const weeklyData = {};
    records.forEach(record => {
      const date = new Date(record.record_date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey] || new Date(record.record_date) > new Date(weeklyData[weekKey].record_date)) {
        weeklyData[weekKey] = record;
      }
    });
    
    labels = Object.keys(weeklyData).sort().map(week => {
      const date = new Date(week);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });
    data = Object.keys(weeklyData).sort().map(week => weeklyData[week].weight);
  } else if (period === '6m' || period === 'year') {
    // Группируем по месяцам
    const monthlyData = {};
    records.forEach(record => {
      const date = new Date(record.record_date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!monthlyData[monthKey] || new Date(record.record_date) > new Date(monthlyData[monthKey].record_date)) {
        monthlyData[monthKey] = record;
      }
    });
    
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    labels = Object.keys(monthlyData).sort().map(monthKey => {
      const [year, month] = monthKey.split('-');
      return `${monthNames[parseInt(month)]} ${year.slice(-2)}`;
    });
    data = Object.keys(monthlyData).sort().map(month => monthlyData[month].weight);
  }
  
  return { labels, datasets: [{ data }] };
}

function generateWeightRecommendations(stats, currentWeight, targetWeight) {
  const recommendations = [];
  
  // Анализ прогресса
  if (stats.progressPercentage >= 100) {
    recommendations.push({
      icon: 'trophy',
      color: '#43cea2',
      text: 'Поздравляем! Вы достигли своей цели по весу!'
    });
  } else if (stats.progressPercentage >= 75) {
    recommendations.push({
      icon: 'trending-down',
      color: '#43cea2',
      text: 'Отличный прогресс! Вы почти достигли цели по весу.'
    });
  } else if (stats.progressPercentage >= 50) {
    recommendations.push({
      icon: 'trending-down',
      color: '#6C63FF',
      text: 'Хороший прогресс! Продолжайте следить за питанием.'
    });
  } else if (stats.progressPercentage >= 25) {
    recommendations.push({
      icon: 'trending-down',
      color: '#ff9800',
      text: 'Прогресс есть, но можно ускорить достижение цели.'
    });
  } else {
    recommendations.push({
      icon: 'alert-circle',
      color: '#ff6b6b',
      text: 'Необходимо скорректировать план питания для достижения цели.'
    });
  }
  
  // Анализ изменений веса
  if (stats.weightChange > 0) {
    recommendations.push({
      icon: 'trending-up',
      color: '#ff6b6b',
      text: 'Вес увеличился. Рекомендуется пересмотреть рацион питания.'
    });
  } else if (stats.weightChange < -2) {
    recommendations.push({
      icon: 'trending-down',
      color: '#43cea2',
      text: 'Отличная динамика снижения веса! Продолжайте в том же духе.'
    });
  }
  
  return recommendations;
}
