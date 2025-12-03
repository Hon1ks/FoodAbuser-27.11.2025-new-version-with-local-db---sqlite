import React, { createContext, useContext, useReducer, useEffect } from 'react';
import * as DatabaseService from '../services/DatabaseService';

// Начальное состояние
const initialState = {
  meals: [],
  loading: false,
  error: null,
  stats: {
    totalCalories: 0,
    totalProtein: 0,
    totalFat: 0,
    totalCarbs: 0,
    averageCalories: 0,
  },
  periodStats: {
    day: { calories: 0, meals: 0 },
    week: { calories: 0, meals: 0 },
    month: { calories: 0, meals: 0 },
  }
};

// Типы действий
const MEAL_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_MEALS: 'SET_MEALS',
  ADD_MEAL: 'ADD_MEAL',
  UPDATE_MEAL: 'UPDATE_MEAL',
  DELETE_MEAL: 'DELETE_MEAL',
  SET_ERROR: 'SET_ERROR',
  CALCULATE_STATS: 'CALCULATE_STATS',
};

// Редьюсер
function mealReducer(state, action) {
  switch (action.type) {
    case MEAL_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case MEAL_ACTIONS.SET_MEALS:
      return { 
        ...state, 
        meals: action.payload,
        loading: false,
        error: null 
      };
    
    case MEAL_ACTIONS.ADD_MEAL:
      const newMeals = [...state.meals, action.payload];
      return { 
        ...state, 
        meals: newMeals,
        loading: false 
      };
    
    case MEAL_ACTIONS.UPDATE_MEAL:
      const updatedMeals = state.meals.map(meal => 
        meal.id === action.payload.id ? action.payload : meal
      );
      return { 
        ...state, 
        meals: updatedMeals,
        loading: false 
      };
    
    case MEAL_ACTIONS.DELETE_MEAL:
      const filteredMeals = state.meals.filter(meal => meal.id !== action.payload);
      return { 
        ...state, 
        meals: filteredMeals,
        loading: false 
      };
    
    case MEAL_ACTIONS.SET_ERROR:
      return { 
        ...state, 
        error: action.payload,
        loading: false 
      };
    
    case MEAL_ACTIONS.CALCULATE_STATS:
      return { 
        ...state, 
        stats: action.payload.stats,
        periodStats: action.payload.periodStats 
      };
    
    default:
      return state;
  }
}

// Создание контекста
const MealContext = createContext();

// Провайдер контекста
export function MealProvider({ children }) {
  const [state, dispatch] = useReducer(mealReducer, initialState);

  // Функции для работы с данными
  const actions = {
    // Загрузка приемов пищи
    // DONE 27.11.2025: Заменено на запрос к локальной SQLite БД через DatabaseService
    loadMeals: async (period = 'week') => {
      dispatch({ type: MEAL_ACTIONS.SET_LOADING, payload: true });
      try {
        const meals = await DatabaseService.loadMeals(period);
        dispatch({ type: MEAL_ACTIONS.SET_MEALS, payload: meals });
        calculateStats(meals);
      } catch (error) {
        console.error('Error loading meals:', error);
        dispatch({ type: MEAL_ACTIONS.SET_ERROR, payload: error.message });
      }
    },

    // Добавление приема пищи
    // DONE 27.11.2025: Заменено на сохранение в локальную SQLite БД через DatabaseService
    addMeal: async (mealData) => {
      dispatch({ type: MEAL_ACTIONS.SET_LOADING, payload: true });
      try {
        const newMeal = await DatabaseService.addMeal(mealData);
        dispatch({ type: MEAL_ACTIONS.ADD_MEAL, payload: newMeal });
        calculateStats([...state.meals, newMeal]);
      } catch (error) {
        console.error('Error adding meal:', error);
        dispatch({ type: MEAL_ACTIONS.SET_ERROR, payload: error.message });
      }
    },

    // Обновление приема пищи
    // DONE 27.11.2025: Заменено на обновление в локальной SQLite БД через DatabaseService
    updateMeal: async (mealData) => {
      dispatch({ type: MEAL_ACTIONS.SET_LOADING, payload: true });
      try {
        const updatedMeal = await DatabaseService.updateMeal(mealData);
        dispatch({ type: MEAL_ACTIONS.UPDATE_MEAL, payload: updatedMeal });
        calculateStats(state.meals.map(meal => 
          meal.id === updatedMeal.id ? updatedMeal : meal
        ));
      } catch (error) {
        console.error('Error updating meal:', error);
        dispatch({ type: MEAL_ACTIONS.SET_ERROR, payload: error.message });
      }
    },

    // Удаление приема пищи
    // DONE 27.11.2025: Заменено на удаление из локальной SQLite БД через DatabaseService
    deleteMeal: async (mealId) => {
      dispatch({ type: MEAL_ACTIONS.SET_LOADING, payload: true });
      try {
        await DatabaseService.deleteMeal(mealId);
        dispatch({ type: MEAL_ACTIONS.DELETE_MEAL, payload: mealId });
        calculateStats(state.meals.filter(meal => meal.id !== mealId));
      } catch (error) {
        console.error('Error deleting meal:', error);
        dispatch({ type: MEAL_ACTIONS.SET_ERROR, payload: error.message });
      }
    },

    // Получение данных для графика
    getChartData: (period, type) => {
      return generateChartData(state.meals, period, type);
    },

    // Получение рекомендаций
    getRecommendations: () => {
      return generateRecommendations(state.stats, state.periodStats);
    }
  };

  // Функция расчета статистики
  const calculateStats = (meals) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Общая статистика
    const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    const totalProtein = meals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
    const totalFat = meals.reduce((sum, meal) => sum + (meal.fat || 0), 0);
    const totalCarbs = meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
    const averageCalories = meals.length > 0 ? totalCalories / meals.length : 0;

    // Статистика по периодам
    const dayMeals = meals.filter(meal => new Date(meal.meal_time) >= today);
    const weekMeals = meals.filter(meal => new Date(meal.meal_time) >= weekStart);
    const monthMeals = meals.filter(meal => new Date(meal.meal_time) >= monthStart);

    const stats = {
      totalCalories,
      totalProtein,
      totalFat,
      totalCarbs,
      averageCalories,
    };

    const periodStats = {
      day: {
        calories: dayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0),
        meals: dayMeals.length
      },
      week: {
        calories: weekMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0),
        meals: weekMeals.length
      },
      month: {
        calories: monthMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0),
        meals: monthMeals.length
      }
    };

    dispatch({ 
      type: MEAL_ACTIONS.CALCULATE_STATS, 
      payload: { stats, periodStats } 
    });
  };

  // Загрузка данных при монтировании (с задержкой)
  useEffect(() => {
    const timer = setTimeout(() => {
      actions.loadMeals('week').catch(err => {
        console.warn('Failed to load meals:', err);
      });
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  const value = {
    ...state,
    ...actions,
  };

  return (
    <MealContext.Provider value={value}>
      {children}
    </MealContext.Provider>
  );
}

// Хук для использования контекста
export function useMeals() {
  const context = useContext(MealContext);
  if (!context) {
    throw new Error('useMeals must be used within a MealProvider');
  }
  return context;
}

// Вспомогательные функции для генерации моковых данных
// DONE 27.11.2025: Функция оставлена для тестирования, но больше не используется в production
// Данные теперь загружаются из локальной SQLite БД через DatabaseService
function generateMockMeals(period) {
  const meals = [];
  const now = new Date();
  
  // Генерируем данные в зависимости от периода
  let daysBack = 7; // по умолчанию неделя
  if (period === 'day') daysBack = 1;
  else if (period === 'month') daysBack = 30;
  else if (period === '3m') daysBack = 90;
  else if (period === '6m') daysBack = 180;
  else if (period === 'year') daysBack = 365;

  for (let i = 0; i < daysBack; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Генерируем 2-4 приема пищи в день
    const mealsPerDay = Math.floor(Math.random() * 3) + 2;
    
    for (let j = 0; j < mealsPerDay; j++) {
      const mealTime = new Date(date);
      mealTime.setHours(8 + j * 4 + Math.random() * 2);
      
      const calories = Math.floor(Math.random() * 600) + 200;
      const protein = Math.floor(calories * 0.15 / 4); // 15% от калорий
      const fat = Math.floor(calories * 0.25 / 9); // 25% от калорий
      const carbs = Math.floor(calories * 0.6 / 4); // 60% от калорий
      
      meals.push({
        id: `${date.toISOString().split('T')[0]}_${j}`,
        title: `Прием пищи ${j + 1}`,
        description: `Описание приема пищи ${j + 1}`,
        category: ['breakfast', 'lunch', 'dinner', 'snack'][j % 4],
        calories,
        protein,
        fat,
        carbs,
        portion_weight: Math.floor(Math.random() * 300) + 100,
        meal_time: mealTime.toISOString(),
        created_at: mealTime.toISOString(),
      });
    }
  }
  
  return meals.sort((a, b) => new Date(b.meal_time) - new Date(a.meal_time));
}

function generateChartData(meals, period, type) {
  const now = new Date();
  let labels = [];
  let data = [];
  
  if (type === 'weight') {
    // Для веса данные берутся из WeightContext
    // TODO: Интегрировать с WeightContext (оставлено для будущей оптимизации)
    return {
      day: { labels: ['08:00', '12:00', '16:00', '20:00'], datasets: [{ data: [80, 80.1, 80, 79.9] }] },
      week: { labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'], datasets: [{ data: [80.2, 80.1, 80, 80, 79.9, 79.8, 79.7] }] },
      month: { labels: ['1', '5', '10', '15', '20', '25', '30'], datasets: [{ data: [81, 80.7, 80.5, 80.2, 80, 79.8, 79.7] }] },
      '3m': { labels: ['Май', 'Июнь', 'Июль'], datasets: [{ data: [83, 81, 79.7] }] },
      '6m': { labels: ['Март', 'Апр', 'Май', 'Июнь', 'Июль'], datasets: [{ data: [85, 84, 83, 81, 79.7] }] },
      year: { labels: ['2024', '2025'], datasets: [{ data: [90, 79.7] }] },
    }[period];
  }
  
  // Для калорий используем реальные данные
  if (period === 'day') {
    // Группируем по часам
    const hourlyData = {};
    meals.forEach(meal => {
      const hour = new Date(meal.meal_time).getHours();
      if (!hourlyData[hour]) hourlyData[hour] = 0;
      hourlyData[hour] += meal.calories || 0;
    });
    
    labels = Object.keys(hourlyData).sort((a, b) => a - b).map(h => `${h}:00`);
    data = Object.keys(hourlyData).sort((a, b) => a - b).map(h => hourlyData[h]);
  } else if (period === 'week') {
    // Группируем по дням недели
    const dailyData = {};
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    
    meals.forEach(meal => {
      const day = new Date(meal.meal_time).getDay();
      if (!dailyData[day]) dailyData[day] = 0;
      dailyData[day] += meal.calories || 0;
    });
    
    labels = dayNames;
    data = dayNames.map((_, index) => dailyData[index] || 0);
  } else if (period === 'month') {
    // Группируем по дням месяца
    const monthlyData = {};
    meals.forEach(meal => {
      const day = new Date(meal.meal_time).getDate();
      if (!monthlyData[day]) monthlyData[day] = 0;
      monthlyData[day] += meal.calories || 0;
    });
    
    labels = Object.keys(monthlyData).sort((a, b) => a - b);
    data = Object.keys(monthlyData).sort((a, b) => a - b).map(day => monthlyData[day]);
  }
  
  return { labels, datasets: [{ data }] };
}

function generateRecommendations(stats, periodStats) {
  const recommendations = [];
  
  // Анализ калорий
  if (stats.averageCalories < 1200) {
    recommendations.push({
      icon: 'food',
      color: '#ff6b6b',
      text: 'Среднее потребление калорий слишком низкое. Рекомендуется увеличить порции.'
    });
  } else if (stats.averageCalories > 3000) {
    recommendations.push({
      icon: 'food-off',
      color: '#ff6b6b',
      text: 'Среднее потребление калорий превышает норму. Рекомендуется уменьшить порции.'
    });
  }
  
  // Анализ белка
  const proteinPercentage = (stats.totalProtein * 4) / stats.totalCalories * 100;
  if (proteinPercentage < 10) {
    recommendations.push({
      icon: 'food-drumstick',
      color: '#4ecdc4',
      text: 'Недостаточно белка в рационе. Добавьте больше мясных и молочных продуктов.'
    });
  }
  
  // Анализ воды (если есть данные)
  if (periodStats.day.calories > 0 && periodStats.day.calories < 1500) {
    recommendations.push({
      icon: 'cup-water',
      color: '#43cea2',
      text: 'Пейте больше воды — это важно для обмена веществ и контроля аппетита.'
    });
  }
  
  // Общие рекомендации
  if (recommendations.length === 0) {
    recommendations.push({
      icon: 'check-circle',
      color: '#43cea2',
      text: 'Отличный баланс питания! Продолжайте в том же духе.'
    });
  }
  
  return recommendations;
}


