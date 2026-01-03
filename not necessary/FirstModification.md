ТЗ: Переделать FoodAbuser в полностью оффлайн-приложение с локальным ИИ (версия 2.0)

Текущая ситуация:
- Проект на Expo SDK 53, React Native 0.79.6, React 19
- Уже есть: навигация, все экраны, ThemeContext, SettingsContext, MealContext, WeightContext (но с моками), AddMealScreen, AnalyticsScreen и т.д.
- Сейчас используются моковые данные и AsyncStorage только для темы/настроек.

---

## СТАТУС ВЫПОЛНЕНИЯ (Обновлено: 02.12.2025)

### ✅ Шаг 1: Полная замена всех моков на реальную локальную БД (ВЫПОЛНЕНО)
   - ✅ Установлено: expo-sqlite
   - ✅ Создан src/services/DatabaseService.js с полным функционалом:
     • initDB() — создает таблицы: users, meals, water_records, weight_records, user_settings
     • CRUD-функции для meals: loadMeals, addMeal, updateMeal, deleteMeal
     • CRUD-функции для weight: loadWeightRecords, addWeightRecord, updateWeightRecord, deleteWeightRecord
     • CRUD-функции для water: loadWaterRecords, addWaterRecord, updateWaterRecord, deleteWaterRecord
     • exportAllData() / importAllData() / clearAllData()
     • Поддержка веб-платформы (Platform.OS === 'web' checks)
   - ✅ Переписан MealContext.js: использует DatabaseService вместо моков
   - ✅ Переписан WeightContext.js: использует DatabaseService вместо моков
   - ✅ initDB() вызывается в App.js при первом запуске

### ✅ Шаг 2: Локальная аутентификация (ВЫПОЛНЕНО)
   - ✅ Создан src/context/AuthContext.js с полным функционалом:
     • Первый запуск → экран установки PIN-кода 4–6 цифр (с подтверждением)
     • Последующие запуски → экран ввода PIN-кода
     • Биометрическая аутентификация (expo-local-authentication): Face ID / Touch ID / Fingerprint
     • Хранение PIN-кода: зашифровано через expo-secure-store (с fallback на AsyncStorage для веб)
     • Защита от брутфорса: 5 попыток → блокировка на 5 минут
     • Опция сброса данных (удаляются все данные из БД + PIN)
   - ✅ Установлены зависимости: expo-local-authentication, expo-secure-store
   - ✅ Обновлен AuthScreen.js: интеграция с AuthContext
   - ✅ Обновлен App.js: AuthProvider оборачивает всё приложение
   - ✅ Обновлен src/navigation/index.js: реактивная навигация на основе isAuthenticated
   - ✅ После успешного входа → MainTabs

### ⏳ Шаг 3: Локальный ИИ для анализа фото еды (В ОЖИДАНИИ)
   - ❌ Использовать готовый пакет: npx expo install react-native-moondream или expo-moondream
   - ❌ Добавить в AddMealScreen:
     • Кнопки: «Сфотографировать» (expo-camera) и «Выбрать из галереи» (expo-image-picker)
     • После выбора фото → вызов локальной модели Moondream-2
     • Промпт: "Распознай еду на фото. Верни JSON: {foods: [{name: string, weight_grams: number, calories: number, protein: number, fat: number, carbs: number}], total: {calories, protein, fat, carbs}}"
     • Показывать прелоадер 1–3 секунды
     • Результат валидировать и подставлять в форму добавления приёма пищи
     • Пользователь может отредактировать любые значения вручную
   - ❌ Фото после анализа сразу удалять из памяти (не сохранять)

### ⏳ Шаг 4: Экспорт и импорт всех данных (В ОЖИДАНИИ)
   - ✅ DatabaseService.js уже имеет exportAllData() и importAllData()
   - ❌ В SettingsScreen добавить UI для экспорта/импорта:
     • Кнопка «Экспорт данных» → собирает все записи из SQLite → JSON → expo-sharing
     • Кнопка «Импорт данных» → выбор JSON-файла → парсинг → запись в БД (с подтверждением перезаписи)
   - ❌ Формат JSON должен быть читаемым и с версией (для будущей совместимости)

---

## ПРОГРЕСС: 2 из 4 шагов завершено (50%)

**Статус**: Приложение работает с локальной SQLite базой данных и локальной аутентификацией через PIN-код и биометрию. Готово к добавлению локального ИИ и функций экспорта/импорта.

**Следующие шаги**: 
1. Интегрировать Moondream-2 для анализа фото еды
2. Добавить UI для экспорта/импорта данных в SettingsScreen