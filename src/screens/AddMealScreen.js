import * as React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, useTheme, Surface, HelperText, IconButton, Menu, Divider, Portal, Modal, ProgressBar, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

const categories = [
  { label: 'Завтрак', value: 'breakfast', icon: 'food-croissant' },
  { label: 'Обед', value: 'lunch', icon: 'food' },
  { label: 'Ужин', value: 'dinner', icon: 'food-apple' },
  { label: 'Перекус', value: 'snack', icon: 'cookie' },
];

export default function AddMealScreen() {
  const theme = useTheme();
  const [description, setDescription] = React.useState('');
  const [category, setCategory] = React.useState(categories[0].value);
  const [portion, setPortion] = React.useState('');
  const [date, setDate] = React.useState(new Date());
  const [showDate, setShowDate] = React.useState(false);
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [error, setError] = React.useState('');
  const [weight, setWeight] = React.useState('');
  const [water, setWater] = React.useState('');
  const [weightModal, setWeightModal] = React.useState(false);
  const [waterModal, setWaterModal] = React.useState(false);
  const [weightInput, setWeightInput] = React.useState('');
  const [waterInput, setWaterInput] = React.useState('');
  
  // Для трекера воды:
  const [waterAmount, setWaterAmount] = React.useState(0);
  const [waterGoal, setWaterGoal] = React.useState(2000); // 2 литра в мл
  const [waterGoalModal, setWaterGoalModal] = React.useState(false);
  const [waterGoalInput, setWaterGoalInput] = React.useState('');
  const [manualWaterModal, setManualWaterModal] = React.useState(false);
  const [manualWaterInput, setManualWaterInput] = React.useState('');
  
  // Для трекера веса:
  const [currentWeight, setCurrentWeight] = React.useState(70); // текущий вес в кг
  const [targetWeight, setTargetWeight] = React.useState(65); // целевой вес в кг
  const [initialWeight, setInitialWeight] = React.useState(75); // начальный вес в кг
  const [weightHistory, setWeightHistory] = React.useState([]);
  const [weightSettingsModal, setWeightSettingsModal] = React.useState(false);
  const [targetWeightInput, setTargetWeightInput] = React.useState('');
  const [initialWeightInput, setInitialWeightInput] = React.useState('');
  const [weightSettingsType, setWeightSettingsType] = React.useState(''); // 'target' или 'initial'
  const [weightSettingsMenuVisible, setWeightSettingsMenuVisible] = React.useState(false);

  const addWater = (amount) => {
    setWaterAmount((prev) => Math.min(prev + amount, waterGoal));
  };

  const resetWater = () => {
    setWaterAmount(0);
  };

  const setWaterGoalHandler = () => {
    if (waterGoalInput && !isNaN(Number(waterGoalInput))) {
      setWaterGoal(Number(waterGoalInput) * 1000); // конвертируем литры в мл
      setWaterGoalInput('');
      setWaterGoalModal(false);
    }
  };

  const addManualWater = () => {
    if (manualWaterInput && !isNaN(Number(manualWaterInput))) {
      addWater(Number(manualWaterInput));
      setManualWaterInput('');
      setManualWaterModal(false);
    }
  };

  const addWeightRecord = (weight) => {
    const newRecord = {
      weight: parseFloat(weight),
      date: new Date().toISOString(),
    };
    setWeightHistory(prev => [...prev, newRecord]);
    setCurrentWeight(parseFloat(weight));
    setWeightInput('');
    setWeightModal(false);
  };

  const getWeightProgress = () => {
    const startWeight = weightHistory.length > 0 ? weightHistory[0].weight : initialWeight;
    
    if (startWeight === targetWeight) return 1; // Цель уже достигнута
    
    // Если цель - похудение (начальный > целевой)
    if (startWeight > targetWeight) {
      const totalChange = startWeight - targetWeight; // Общее количество кг для похудения
      const currentChange = startWeight - currentWeight; // Уже сброшено кг
      
      if (totalChange === 0) return 0;
      
      const progress = Math.max(0, Math.min(currentChange / totalChange, 1));
      // Пример: начальный 75, цель 65, текущий 68
      // totalChange = 75 - 65 = 10 кг, currentChange = 75 - 68 = 7 кг
      // progress = 7/10 = 0.7 (70%)
      return progress;
    }
    // Если цель - набор веса (начальный < целевой)
    else {
      const totalChange = targetWeight - startWeight; // Общее количество кг для набора
      const currentChange = currentWeight - startWeight; // Уже набрано кг
      
      if (totalChange === 0) return 0;
      
      const progress = Math.max(0, Math.min(currentChange / totalChange, 1));
      // Пример: начальный 60, цель 70, текущий 65
      // totalChange = 70 - 60 = 10 кг, currentChange = 65 - 60 = 5 кг
      // progress = 5/10 = 0.5 (50%)
      return progress;
    }
  };

  const openWeightSettings = (type) => {
    setWeightSettingsType(type);
    if (type === 'target') {
      setTargetWeightInput(targetWeight.toString());
    } else if (type === 'initial') {
      setInitialWeightInput(initialWeight.toString());
    }
    setWeightSettingsModal(true);
  };

  const saveWeightSettings = () => {
    if (weightSettingsType === 'target' && targetWeightInput && !isNaN(Number(targetWeightInput))) {
      setTargetWeight(Number(targetWeightInput));
      setTargetWeightInput('');
    } else if (weightSettingsType === 'initial' && initialWeightInput && !isNaN(Number(initialWeightInput))) {
      setInitialWeight(Number(initialWeightInput));
      setInitialWeightInput('');
    }
    setWeightSettingsModal(false);
  };

  const handleSave = () => {
    setError('');
    if (!description.trim()) {
      setError('Введите описание');
      return;
    }
    if (!portion.trim() || isNaN(Number(portion))) {
      setError('Укажите размер порции (в граммах)');
      return;
    }
    // TODO: логика сохранения приёма пищи
  };

  return (
    <View style={styles.flex}>
      <LinearGradient
        colors={["#1230c7de", "#000000", "#15c712de"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Первый бокс - Улучшенное добавление приёма пищи */}
          <Surface style={styles.mealSurface} elevation={4}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealTitle}>🍽️ Добавление приёма пищи</Text>
              <View style={styles.mealSubtitle}>
                <Text style={styles.mealSubtitleText}>Запишите свой приём пищи</Text>
              </View>
            </View>

            {/* Быстрые действия */}
            <View style={styles.quickActionsContainer}>
              <Text style={styles.sectionLabel}>Быстрые действия</Text>
              <View style={styles.quickActions}>
                <Chip
                  icon="camera"
                  mode="outlined"
                  onPress={() => {}}
                  style={styles.actionChip}
                  textStyle={styles.chipText}
                >
                  Фото
                </Chip>
                <Chip
                  icon="image"
                  mode="outlined"
                  onPress={() => {}}
                  style={styles.actionChip}
                  textStyle={styles.chipText}
                >
                  Галерея
                </Chip>
                <Chip
                  icon="microphone"
                  mode="outlined"
                  onPress={() => {}}
                  style={styles.actionChip}
                  textStyle={styles.chipText}
                >
                  Голос
                </Chip>
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.sectionLabel}>Описание</Text>
              <TextInput
                label="Что вы ели?"
                value={description}
                onChangeText={setDescription}
                style={styles.mealInput}
                multiline
                placeholder="Опишите вашу еду..."
                left={<TextInput.Icon icon="food-fork-drink" iconColor="#6C63FF" />}
                error={!!error && !description.trim()}
                mode="outlined"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.sectionLabel}>Категория</Text>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    icon={categories.find(c => c.value === category).icon}
                    onPress={() => setMenuVisible(true)}
                    style={styles.categoryBtn}
                    labelStyle={styles.categoryBtnText}
                  >
                    {categories.find(c => c.value === category).label}
                  </Button>
                }
              >
                {categories.map(cat => (
                  <Menu.Item
                    key={cat.value}
                    onPress={() => { setCategory(cat.value); setMenuVisible(false); }}
                    title={cat.label}
                    leadingIcon={cat.icon}
                  />
                ))}
              </Menu>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.sectionLabel}>Размер порции</Text>
              <TextInput
                label="Вес в граммах"
                value={portion}
                onChangeText={setPortion}
                keyboardType="numeric"
                style={styles.mealInput}
                placeholder="Например: 250"
                left={<TextInput.Icon icon="scale" iconColor="#6C63FF" />}
                error={!!error && (!portion.trim() || isNaN(Number(portion)))}
                mode="outlined"
              />
            </View>

            {error ? <HelperText type="error" visible style={styles.errorText}>{error}</HelperText> : null}
            
            <Button
              mode="contained"
              style={styles.saveMealBtn}
              onPress={handleSave}
              contentStyle={{height: 52}}
              labelStyle={styles.saveMealBtnText}
              icon="check"
            >
              Сохранить приём пищи
            </Button>
          </Surface>

          {/* Второй бокс - Улучшенный трекер воды */}
          <Surface style={[styles.surface, { marginTop: 0 }]} elevation={4}>
            <View style={styles.headerRow}>
              <Text style={[styles.title, { color: '#3b82f6' }]}>💧 Трекер воды</Text>
              <IconButton
                icon="cog"
                size={24}
                iconColor="#3b82f6"
                onPress={() => setWaterGoalModal(true)}
              />
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressText}>
                  {waterAmount} / {waterGoal} мл
                </Text>
                <Text style={styles.progressPercent}>
                  {Math.round((waterAmount / waterGoal) * 100)}%
                </Text>
              </View>
              <ProgressBar 
                progress={waterAmount / waterGoal} 
                color="#3b82f6" 
                style={styles.progressBar}
              />
            </View>

            <View style={styles.waterButtons}>
              <Button
                mode="outlined"
                style={[styles.waterButton, { marginRight: 8 }]}
                onPress={() => addWater(200)}
                icon="cup"
              >
                +200 мл
              </Button>
              <Button
                mode="outlined"
                style={styles.waterButton}
                onPress={() => addWater(500)}
                icon="water"
              >
                +500 мл
              </Button>
            </View>
            
            <View style={styles.waterActions}>
              <Button
                mode="text"
                onPress={() => setManualWaterModal(true)}
                icon="plus"
                style={{ marginRight: 8 }}
              >
                Ручной ввод
              </Button>
              <Button
                mode="text"
                onPress={resetWater}
                icon="refresh"
              >
                Сбросить
              </Button>
            </View>
          </Surface>

          {/* Третий бокс - Улучшенный трекер веса */}
          <Surface style={[styles.surface, { marginTop: 0 }]} elevation={4}>
            <View style={styles.headerRow}>
              <Text style={[styles.title, { color: '#10b981' }]}>⚖️ Трекер веса</Text>
              <Menu
                visible={weightSettingsMenuVisible}
                onDismiss={() => setWeightSettingsMenuVisible(false)}
                anchor={
                  <IconButton
                    icon="cog"
                    size={24}
                    iconColor="#10b981"
                    onPress={() => setWeightSettingsMenuVisible(true)}
                  />
                }
              >
                <Menu.Item
                  onPress={() => {
                    setWeightSettingsMenuVisible(false);
                    openWeightSettings('target');
                  }}
                  title="Установить цель по весу"
                  leadingIcon="target"
                />
                                        <Menu.Item
                          onPress={() => {
                            setWeightSettingsMenuVisible(false);
                            openWeightSettings('initial');
                          }}
                          title="Установить начальный вес"
                          leadingIcon="flag"
                        />
              </Menu>
            </View>
            
            <View style={styles.weightInfo}>
              <View style={styles.weightItem}>
                <Text style={styles.weightLabel}>Начальный</Text>
                <Text style={styles.weightValue}>{initialWeight} кг</Text>
              </View>
              <View style={styles.weightItem}>
                <Text style={styles.weightLabel}>Текущий</Text>
                <Text style={styles.weightValue}>{currentWeight} кг</Text>
              </View>
              <View style={styles.weightItem}>
                <Text style={styles.weightLabel}>Цель</Text>
                <Text style={styles.weightValue}>{targetWeight} кг</Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressText}>
                  Прогресс к цели
                </Text>
                <Text style={styles.progressPercent}>
                  {Math.round(getWeightProgress() * 100)}%
                </Text>
              </View>
              <ProgressBar 
                progress={getWeightProgress()} 
                color="#10b981" 
                style={styles.progressBar}
              />
            </View>

            <Button
              mode="contained"
              icon="plus"
              onPress={() => setWeightModal(true)}
              style={[styles.weightButton, { backgroundColor: '#10b981' }]}
            >
              Записать новый вес
            </Button>
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <Portal>
        {/* Модальное окно для установки цели воды */}
        <Modal visible={waterGoalModal} onDismiss={() => setWaterGoalModal(false)} contentContainerStyle={{ backgroundColor: '#fff', padding: 24, borderRadius: 18, marginHorizontal: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#3b82f6', textAlign: 'center' }}>Установить цель</Text>
          <TextInput
            label="Цель (литры)"
            value={waterGoalInput}
            onChangeText={setWaterGoalInput}
            keyboardType="numeric"
            style={{ marginBottom: 16, backgroundColor: '#f6f6fa' }}
            left={<TextInput.Icon icon="target" />}
            placeholder="Например: 2.5"
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Button mode="outlined" onPress={() => setWaterGoalModal(false)} style={{ flex: 1, marginRight: 8 }}>
              Отмена
            </Button>
            <Button 
              mode="contained" 
              onPress={setWaterGoalHandler} 
              style={{ flex: 1, backgroundColor: '#3b82f6' }}
              disabled={!waterGoalInput || isNaN(Number(waterGoalInput))}
            >
              Сохранить
            </Button>
          </View>
        </Modal>

        {/* Модальное окно для ручного ввода воды */}
        <Modal visible={manualWaterModal} onDismiss={() => setManualWaterModal(false)} contentContainerStyle={{ backgroundColor: '#fff', padding: 24, borderRadius: 18, marginHorizontal: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#3b82f6', textAlign: 'center' }}>Добавить воду</Text>
          <TextInput
            label="Количество (мл)"
            value={manualWaterInput}
            onChangeText={setManualWaterInput}
            keyboardType="numeric"
            style={{ marginBottom: 16, backgroundColor: '#f6f6fa' }}
            left={<TextInput.Icon icon="cup-water" />}
            placeholder="Например: 300"
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Button mode="outlined" onPress={() => setManualWaterModal(false)} style={{ flex: 1, marginRight: 8 }}>
              Отмена
            </Button>
            <Button 
              mode="contained" 
              onPress={addManualWater} 
              style={{ flex: 1, backgroundColor: '#3b82f6' }}
              disabled={!manualWaterInput || isNaN(Number(manualWaterInput))}
            >
              Добавить
            </Button>
          </View>
        </Modal>

        {/* Модальное окно для записи веса */}
        <Modal visible={weightModal} onDismiss={() => setWeightModal(false)} contentContainerStyle={{ backgroundColor: '#fff', padding: 24, borderRadius: 18, marginHorizontal: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#10b981', textAlign: 'center' }}>Записать вес</Text>
          <TextInput
            label="Вес (кг)"
            value={weightInput}
            onChangeText={setWeightInput}
            keyboardType="numeric"
            style={{ marginBottom: 16, backgroundColor: '#f6f6fa' }}
            left={<TextInput.Icon icon="weight-kilogram" />}
            placeholder="Например: 68.5"
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Button mode="outlined" onPress={() => setWeightModal(false)} style={{ flex: 1, marginRight: 8 }}>
              Отмена
            </Button>
            <Button 
              mode="contained" 
              onPress={() => weightInput && addWeightRecord(weightInput)} 
              style={{ flex: 1, backgroundColor: '#10b981' }}
              disabled={!weightInput || isNaN(Number(weightInput))}
            >
              Сохранить
            </Button>
          </View>
        </Modal>

        {/* Модальное окно для настроек веса */}
        <Modal visible={weightSettingsModal} onDismiss={() => setWeightSettingsModal(false)} contentContainerStyle={{ backgroundColor: '#fff', padding: 24, borderRadius: 18, marginHorizontal: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#10b981', textAlign: 'center' }}>
            {weightSettingsType === 'target' ? 'Установить цель' : 'Установить начальный вес'}
          </Text>
          <TextInput
            label={weightSettingsType === 'target' ? 'Целевой вес (кг)' : 'Начальный вес (кг)'}
            value={weightSettingsType === 'target' ? targetWeightInput : initialWeightInput}
            onChangeText={weightSettingsType === 'target' ? setTargetWeightInput : setInitialWeightInput}
            keyboardType="numeric"
            style={{ marginBottom: 16, backgroundColor: '#f6f6fa' }}
                                left={<TextInput.Icon icon={weightSettingsType === 'target' ? 'target' : 'flag'} />}
            placeholder="Например: 65"
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Button mode="outlined" onPress={() => setWeightSettingsModal(false)} style={{ flex: 1, marginRight: 8 }}>
              Отмена
            </Button>
            <Button 
              mode="contained" 
              onPress={saveWeightSettings} 
              style={{ flex: 1, backgroundColor: '#10b981' }}
              disabled={!((weightSettingsType === 'target' ? targetWeightInput : initialWeightInput) && !isNaN(Number(weightSettingsType === 'target' ? targetWeightInput : initialWeightInput)))}
            >
              Сохранить
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    paddingTop: 64,
    paddingBottom: 16,
    paddingHorizontal: 18,
  },
  surface: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    marginBottom: 32,
  },
  // Новые стили для улучшенного бокса добавления приёма пищи
  mealSurface: {
    width: '100%',
    borderRadius: 24,
    padding: 28,
    backgroundColor: '#fff',
    marginBottom: 32,
  },
  mealHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mealTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6C63FF',
    textAlign: 'center',
    marginBottom: 8,
  },
  mealSubtitle: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mealSubtitleText: {
    fontSize: 14,
    color: '#6C63FF',
    fontWeight: '500',
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginLeft: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  actionChip: {
    marginHorizontal: 4,
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6C63FF',
  },
  inputSection: {
    marginBottom: 20,
  },
  mealInput: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  categoryBtn: {
    borderRadius: 12,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    height: 48,
  },
  categoryBtnText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6C63FF',
  },
  errorText: {
    marginTop: 8,
    marginBottom: 16,
  },
  saveMealBtn: {
    width: '100%',
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: '#43cea2',
    elevation: 4,
  },
  saveMealBtnText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  // Существующие стили
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6C63FF',
    textAlign: 'center',
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  mediaBtn: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 14,
  },
  input: {
    width: '100%',
    marginBottom: 12,
    backgroundColor: '#f6f6fa',
  },
  catBtn: {
    borderRadius: 14,
  },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 7,
    paddingVertical: 4,
    marginLeft: 4,
  },
  timeText: {
    fontSize: 16,
    color: '#232634',
    fontWeight: 'bold',
  },
  saveBtn: {
    width: '100%',
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: '#43cea2',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  waterButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 8,
  },
  waterButton: {
    borderRadius: 14,
    minWidth: 100,
  },
  waterActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  weightInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  weightItem: {
    alignItems: 'center',
  },
  weightLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  weightValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
  weightButton: {
    borderRadius: 14,
    width: '100%',
  },
}); 