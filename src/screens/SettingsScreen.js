import * as React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, useTheme, List, Switch, Button, Portal, Modal, TextInput, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';

export default function SettingsScreen() {
  const theme = useTheme();
  
  // Используем контексты
  const { isDarkMode, toggleTheme } = useCustomTheme();
  const { 
    notifications, 
    goals, 
    privacy, 
    updateNotificationSetting, 
    updateGoal, 
    updatePrivacySetting,
    exportData,
    resetSettings,
    loading 
  } = useSettings();
  
  // Состояние для модальных окон
  const [goalsModalVisible, setGoalsModalVisible] = React.useState(false);
  const [exportModalVisible, setExportModalVisible] = React.useState(false);
  const [resetModalVisible, setResetModalVisible] = React.useState(false);
  
  // Состояние для редактирования целей
  const [editingGoal, setEditingGoal] = React.useState(null);
  const [goalValue, setGoalValue] = React.useState('');

  // Функции для обработки действий
  const handleExportData = async () => {
    const result = await exportData();
    if (result.success) {
      Alert.alert('Успех', 'Данные успешно экспортированы');
    } else {
      Alert.alert('Ошибка', result.error || 'Не удалось экспортировать данные');
    }
    setExportModalVisible(false);
  };

  const handleResetSettings = async () => {
    const result = await resetSettings();
    if (result.success) {
      Alert.alert('Успех', 'Настройки сброшены к значениям по умолчанию');
    } else {
      Alert.alert('Ошибка', result.error || 'Не удалось сбросить настройки');
    }
    setResetModalVisible(false);
  };

  const openGoalEditor = (goalKey, currentValue) => {
    setEditingGoal(goalKey);
    setGoalValue(currentValue.toString());
    setGoalsModalVisible(true);
  };

  const saveGoal = async () => {
    if (editingGoal && goalValue) {
      const numericValue = parseFloat(goalValue);
      if (!isNaN(numericValue)) {
        await updateGoal(editingGoal, numericValue);
        setGoalsModalVisible(false);
        setEditingGoal(null);
        setGoalValue('');
      }
    }
  };

  return (
    <View style={styles.flex}>
      <LinearGradient
        colors={["#1230c7de", "#000000", "#15c712de"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Настройки</Text>
        
        {/* Настройки уведомлений */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>🔔 Уведомления</Text>
            <List.Section>
              <List.Item
                title="Включить уведомления"
                description="Получать напоминания о приемах пищи"
                left={props => <List.Icon {...props} icon="bell-outline" />}
                right={() => (
                  <Switch 
                    value={notifications.enabled} 
                    onValueChange={(value) => updateNotificationSetting('enabled', value)} 
                  />
                )}
              />
              <List.Item
                title="Напоминания о еде"
                description="Уведомления о времени приема пищи"
                left={props => <List.Icon {...props} icon="food" />}
                right={() => (
                  <Switch 
                    value={notifications.mealReminders} 
                    onValueChange={(value) => updateNotificationSetting('mealReminders', value)}
                    disabled={!notifications.enabled}
                  />
                )}
              />
              <List.Item
                title="Напоминания о воде"
                description="Уведомления о необходимости пить воду"
                left={props => <List.Icon {...props} icon="cup-water" />}
                right={() => (
                  <Switch 
                    value={notifications.waterReminders} 
                    onValueChange={(value) => updateNotificationSetting('waterReminders', value)}
                    disabled={!notifications.enabled}
                  />
                )}
              />
            </List.Section>
          </Card.Content>
        </Card>

        {/* Настройки темы */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>🎨 Внешний вид</Text>
            <List.Section>
              <List.Item
                title="Тёмная тема"
                description="Переключить на темный режим"
                left={props => <List.Icon {...props} icon="theme-light-dark" />}
                right={() => (
                  <Switch value={isDarkMode} onValueChange={toggleTheme} />
                )}
              />
            </List.Section>
          </Card.Content>
        </Card>

        {/* Цели и предпочтения */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>🎯 Цели и предпочтения</Text>
            <List.Section>
              <List.Item
                title="Дневная норма калорий"
                description={`${goals.dailyCalories} ккал`}
                left={props => <List.Icon {...props} icon="fire" />}
                onPress={() => openGoalEditor('dailyCalories', goals.dailyCalories)}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
              <List.Item
                title="Дневная норма воды"
                description={`${goals.dailyWater} мл`}
                left={props => <List.Icon {...props} icon="cup-water" />}
                onPress={() => openGoalEditor('dailyWater', goals.dailyWater)}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
              <List.Item
                title="Целевой вес"
                description={`${goals.targetWeight} кг`}
                left={props => <List.Icon {...props} icon="target" />}
                onPress={() => openGoalEditor('targetWeight', goals.targetWeight)}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
              <List.Item
                title="Начальный вес"
                description={`${goals.initialWeight} кг`}
                left={props => <List.Icon {...props} icon="flag" />}
                onPress={() => openGoalEditor('initialWeight', goals.initialWeight)}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
            </List.Section>
          </Card.Content>
        </Card>

        {/* Приватность */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>🔒 Приватность</Text>
            <List.Section>
              <List.Item
                title="Аналитика"
                description="Помочь улучшить приложение"
                left={props => <List.Icon {...props} icon="chart-line" />}
                right={() => (
                  <Switch 
                    value={privacy.analytics} 
                    onValueChange={(value) => updatePrivacySetting('analytics', value)} 
                  />
                )}
              />
            </List.Section>
          </Card.Content>
        </Card>

        {/* Данные */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>📊 Данные</Text>
            <List.Section>
              <List.Item
                title="Экспорт данных"
                description="Создать резервную копию"
                left={props => <List.Icon {...props} icon="file-export-outline" />}
                onPress={() => setExportModalVisible(true)}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
              <List.Item
                title="Сбросить настройки"
                description="Вернуть настройки по умолчанию"
                left={props => <List.Icon {...props} icon="restore" />}
                onPress={() => setResetModalVisible(true)}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
            </List.Section>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Модальные окна */}
      <Portal>
        {/* Модальное окно для редактирования целей */}
        <Modal 
          visible={goalsModalVisible} 
          onDismiss={() => setGoalsModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>
            {editingGoal === 'dailyCalories' && 'Дневная норма калорий'}
            {editingGoal === 'dailyWater' && 'Дневная норма воды'}
            {editingGoal === 'targetWeight' && 'Целевой вес'}
            {editingGoal === 'initialWeight' && 'Начальный вес'}
          </Text>
          <TextInput
            label={
              editingGoal === 'dailyCalories' ? 'Калории' :
              editingGoal === 'dailyWater' ? 'Вода (мл)' :
              editingGoal === 'targetWeight' ? 'Вес (кг)' :
              editingGoal === 'initialWeight' ? 'Вес (кг)' : 'Значение'
            }
            value={goalValue}
            onChangeText={setGoalValue}
            keyboardType="numeric"
            style={styles.input}
            mode="outlined"
          />
          <View style={styles.modalButtons}>
            <Button 
              mode="outlined" 
              onPress={() => setGoalsModalVisible(false)}
              style={styles.modalButton}
            >
              Отмена
            </Button>
            <Button 
              mode="contained" 
              onPress={saveGoal}
              style={styles.modalButton}
              disabled={!goalValue || isNaN(parseFloat(goalValue))}
            >
              Сохранить
            </Button>
          </View>
        </Modal>

        {/* Модальное окно для экспорта данных */}
        <Modal 
          visible={exportModalVisible} 
          onDismiss={() => setExportModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Экспорт данных</Text>
          <Text style={styles.modalDescription}>
            Создать резервную копию всех ваших данных? Файл будет сохранен в формате JSON.
          </Text>
          <View style={styles.modalButtons}>
            <Button 
              mode="outlined" 
              onPress={() => setExportModalVisible(false)}
              style={styles.modalButton}
            >
              Отмена
            </Button>
            <Button 
              mode="contained" 
              onPress={handleExportData}
              style={styles.modalButton}
              loading={loading}
            >
              Экспортировать
            </Button>
          </View>
        </Modal>

        {/* Модальное окно для сброса настроек */}
        <Modal 
          visible={resetModalVisible} 
          onDismiss={() => setResetModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Сброс настроек</Text>
          <Text style={styles.modalDescription}>
            Вы уверены, что хотите сбросить все настройки к значениям по умолчанию? Это действие нельзя отменить.
          </Text>
          <View style={styles.modalButtons}>
            <Button 
              mode="outlined" 
              onPress={() => setResetModalVisible(false)}
              style={styles.modalButton}
            >
              Отмена
            </Button>
            <Button 
              mode="contained" 
              onPress={handleResetSettings}
              style={[styles.modalButton, { backgroundColor: '#ff6b6b' }]}
              loading={loading}
            >
              Сбросить
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 18,
    textAlign: 'center',
  },
  card: {
    borderRadius: 18,
    backgroundColor: '#fff',
    marginBottom: 18,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#232634',
    marginBottom: 12,
    marginTop: 8,
  },
  modal: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 18,
    marginHorizontal: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#6C63FF',
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  input: {
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
}); 