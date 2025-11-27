import * as React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, useTheme, Chip, IconButton, Portal, Modal, Button, ProgressBar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMeals } from '../context/MealContext';
import { useWeight } from '../context/WeightContext';

const screenWidth = Dimensions.get('window').width - 36;
const chartWidth = screenWidth - 32;

const periods = [
  { label: 'День', value: 'day' },
  { label: 'Неделя', value: 'week' },
  { label: 'Месяц', value: 'month' },
  { label: '3 мес', value: '3m' },
  { label: '6 мес', value: '6m' },
  { label: 'Год', value: 'year' },
];

// Удаляем статические данные - теперь используем данные из контекстов


const widgetList = [
  { key: 'weight', label: 'Динамика веса', icon: 'scale-bathroom' },
  { key: 'kcal', label: 'Динамика калорий', icon: 'fire' },
  { key: 'kbju', label: 'Статистика КБЖУ', icon: 'chart-pie' },
];

export default function AnalyticsScreen() {
  const theme = useTheme();
  const [weightPeriod, setWeightPeriod] = React.useState('week');
  const [kcalPeriod, setKcalPeriod] = React.useState('week');

  const [activeWidgets, setActiveWidgets] = React.useState(['weight', 'kcal', 'kbju']);
  const [addWidgetVisible, setAddWidgetVisible] = React.useState(false);

  // Используем контексты для получения данных
  const { 
    stats: mealStats, 
    periodStats, 
    getChartData: getMealChartData,
    getRecommendations: getMealRecommendations,
    loading: mealsLoading 
  } = useMeals();
  
  const { 
    stats: weightStats, 
    currentWeight, 
    targetWeight, 
    initialWeight,
    getChartData: getWeightChartData,
    getRecommendations: getWeightRecommendations,
    loading: weightLoading 
  } = useWeight();

  // Получаем данные для графиков
  const weightData = getWeightChartData(weightPeriod);
  const kcalData = getMealChartData(kcalPeriod, 'kcal');
  
  // Получаем рекомендации
  const mealRecommendations = getMealRecommendations();
  const weightRecommendations = getWeightRecommendations();
  const allRecommendations = [...mealRecommendations, ...weightRecommendations];


  const handleRemoveWidget = key => setActiveWidgets(w => w.filter(k => k !== key));
  const handleAddWidget = key => setActiveWidgets(w => w.includes(key) ? w : [...w, key]);

  return (
    <View style={styles.flex}>
      <LinearGradient
        colors={["#1230c7de", "#000000", "#15c712de"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Аналитика</Text>
          <IconButton icon="plus" size={28} onPress={() => setAddWidgetVisible(true)} style={styles.addBtn} iconColor="#fff" />
        </View>
        {activeWidgets.includes('weight') && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text style={styles.chartTitle}>Динамика веса</Text>
                <IconButton icon="close" size={20} onPress={() => handleRemoveWidget('weight')} />
              </View>
              
              {/* Статистика веса */}
              <View style={styles.weightStatsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Текущий</Text>
                  <Text style={styles.statValue}>{currentWeight.toFixed(1)} кг</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Цель</Text>
                  <Text style={styles.statValue}>{targetWeight.toFixed(1)} кг</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Прогресс</Text>
                  <Text style={styles.statValue}>{weightStats.progressPercentage.toFixed(0)}%</Text>
                </View>
              </View>
              
              <ProgressBar 
                progress={weightStats.progressPercentage / 100} 
                color="#43cea2" 
                style={styles.progressBar}
              />
              
              <View style={styles.periodRow}>
                {periods.map(p => (
                  <Chip
                    key={p.value}
                    selected={weightPeriod === p.value}
                    onPress={() => setWeightPeriod(p.value)}
                    style={styles.chip}
                    textStyle={styles.chipText}
                  >
                    {p.label}
                  </Chip>
                ))}
              </View>
              
              {weightData.labels.length > 0 ? (
                <LineChart
                  data={weightData}
                  width={chartWidth}
                  height={200}
                  chartConfig={weightChartConfig}
                  style={{ borderRadius: 12, alignSelf: 'center' }}
                  fromZero
                  yLabelsOffset={8}
                  formatYLabel={y => Number(y).toFixed(1)}
                />
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>Нет данных для отображения</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}
        {activeWidgets.includes('kcal') && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text style={styles.chartTitle}>Динамика калорий</Text>
                <IconButton icon="close" size={20} onPress={() => handleRemoveWidget('kcal')} />
              </View>
              
              {/* Статистика калорий */}
              <View style={styles.calorieStatsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Сегодня</Text>
                  <Text style={styles.statValue}>{periodStats.day.calories} ккал</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Неделя</Text>
                  <Text style={styles.statValue}>{Math.round(periodStats.week.calories / 7)} ккал/день</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Среднее</Text>
                  <Text style={styles.statValue}>{Math.round(mealStats.averageCalories)} ккал</Text>
                </View>
              </View>
              
              <View style={styles.periodRow}>
                {periods.map(p => (
                  <Chip
                    key={p.value}
                    selected={kcalPeriod === p.value}
                    onPress={() => setKcalPeriod(p.value)}
                    style={styles.chip}
                    textStyle={styles.chipText}
                  >
                    {p.label}
                  </Chip>
                ))}
              </View>
              
              {kcalData.labels.length > 0 ? (
                <LineChart
                  data={kcalData}
                  width={chartWidth}
                  height={200}
                  chartConfig={weightChartConfig}
                  style={{ borderRadius: 12, alignSelf: 'center' }}
                  fromZero
                  yLabelsOffset={8}
                  formatYLabel={y => Math.round(Number(y)).toString()}
                />
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>Нет данных для отображения</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Новый виджет - Статистика КБЖУ */}
        {activeWidgets.includes('kbju') && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text style={styles.chartTitle}>Статистика КБЖУ</Text>
                <IconButton icon="close" size={20} onPress={() => handleRemoveWidget('kbju')} />
              </View>
              
              {/* Общая статистика КБЖУ */}
              <View style={styles.kbjuStatsContainer}>
                <View style={styles.kbjuRow}>
                  <View style={styles.kbjuItem}>
                    <Text style={styles.kbjuLabel}>Калории</Text>
                    <Text style={[styles.kbjuValue, { color: '#ff6b6b' }]}>{Math.round(mealStats.totalCalories)}</Text>
                    <Text style={styles.kbjuUnit}>ккал</Text>
                  </View>
                  <View style={styles.kbjuItem}>
                    <Text style={styles.kbjuLabel}>Белки</Text>
                    <Text style={[styles.kbjuValue, { color: '#4ecdc4' }]}>{Math.round(mealStats.totalProtein)}</Text>
                    <Text style={styles.kbjuUnit}>г</Text>
                  </View>
                </View>
                <View style={styles.kbjuRow}>
                  <View style={styles.kbjuItem}>
                    <Text style={styles.kbjuLabel}>Жиры</Text>
                    <Text style={[styles.kbjuValue, { color: '#ffd93d' }]}>{Math.round(mealStats.totalFat)}</Text>
                    <Text style={styles.kbjuUnit}>г</Text>
                  </View>
                  <View style={styles.kbjuItem}>
                    <Text style={styles.kbjuLabel}>Углеводы</Text>
                    <Text style={[styles.kbjuValue, { color: '#6c5ce7' }]}>{Math.round(mealStats.totalCarbs)}</Text>
                    <Text style={styles.kbjuUnit}>г</Text>
                  </View>
                </View>
              </View>
              
              {/* Процентное соотношение КБЖУ */}
              <View style={styles.kbjuPercentageContainer}>
                <Text style={styles.kbjuPercentageTitle}>Соотношение макронутриентов</Text>
                <View style={styles.kbjuPercentageRow}>
                  <View style={styles.kbjuPercentageItem}>
                    <View style={[styles.kbjuPercentageBar, { backgroundColor: '#4ecdc4', width: '25%' }]} />
                    <Text style={styles.kbjuPercentageText}>Белки 25%</Text>
                  </View>
                  <View style={styles.kbjuPercentageItem}>
                    <View style={[styles.kbjuPercentageBar, { backgroundColor: '#ffd93d', width: '25%' }]} />
                    <Text style={styles.kbjuPercentageText}>Жиры 25%</Text>
                  </View>
                  <View style={styles.kbjuPercentageItem}>
                    <View style={[styles.kbjuPercentageBar, { backgroundColor: '#6c5ce7', width: '50%' }]} />
                    <Text style={styles.kbjuPercentageText}>Углеводы 50%</Text>
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Обновленные рекомендации */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.chartTitle}>Персональные рекомендации</Text>
            {allRecommendations.length > 0 ? (
              allRecommendations.map((recommendation, index) => (
                <View key={index} style={styles.recommendRow}>
                  <MaterialCommunityIcons 
                    name={recommendation.icon} 
                    size={28} 
                    color={recommendation.color} 
                    style={{marginRight: 8}} 
                  />
                  <Text style={styles.recommendText}>
                    {recommendation.text}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.recommendRow}>
                <MaterialCommunityIcons name="information" size={28} color="#6C63FF" style={{marginRight: 8}} />
                <Text style={styles.recommendText}>
                  Добавьте больше данных о питании для получения персональных рекомендаций.
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
        <View style={{ height: 80 }} />
      </ScrollView>
      <Portal>
        <Modal visible={addWidgetVisible} onDismiss={() => setAddWidgetVisible(false)} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>Добавить виджет</Text>
          {widgetList.map(w => (
            <Button
              key={w.key}
              icon={w.icon}
              mode={activeWidgets.includes(w.key) ? 'contained' : 'outlined'}
              style={styles.widgetBtn}
              onPress={() => { handleAddWidget(w.key); setAddWidgetVisible(false); }}
              disabled={activeWidgets.includes(w.key)}
            >
              {w.label}
            </Button>
          ))}
        </Modal>
      </Portal>
    </View>
  );
}

const weightChartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  color: (opacity = 1) => `rgba(76, 99, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(44, 44, 44, ${opacity})`,
  propsForDots: {
    r: '5',
    strokeWidth: '2',
    stroke: '#43cea2',
  },
  propsForBackgroundLines: {
    stroke: '#e0e0e0',
  },
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    paddingTop: 64,
    paddingBottom: 16,
    paddingHorizontal: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  addBtn: {
    position: 'absolute',
    right: 0,
    top: -8,
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
    marginBottom: 0,
  },
  card: {
    borderRadius: 18,
    backgroundColor: '#fff',
    marginBottom: 18,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  chart: {
    borderRadius: 12,
    marginTop: 8,
  },
  chartTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    color: '#232634',
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 4,
  },
  chip: {
    marginHorizontal: 4,
    marginBottom: 4,
    backgroundColor: '#f6f6fa',
    maxWidth: 90,
    minWidth: 88,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 0,
    paddingRight: 0,
    paddingLeft: 3,
  },
  chipText: {
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
    marginLeft: 0,
  },
  widgetBtn: {
    marginVertical: 6,
    borderRadius: 14,
    width: 260,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 18,
    marginHorizontal: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#6C63FF',
  },
  recommendRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendText: {
    fontSize: 16,
    color: '#232634',
    flex: 1,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  // Новые стили для статистики веса
  weightStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#232634',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
    backgroundColor: '#e5e7eb',
  },
  // Новые стили для статистики калорий
  calorieStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  // Новые стили для КБЖУ
  kbjuStatsContainer: {
    marginBottom: 16,
  },
  kbjuRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  kbjuItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  kbjuLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  kbjuValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  kbjuUnit: {
    fontSize: 10,
    color: '#6b7280',
  },
  kbjuPercentageContainer: {
    marginTop: 8,
  },
  kbjuPercentageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  kbjuPercentageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kbjuPercentageItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  kbjuPercentageBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  kbjuPercentageText: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
  // Стили для отсутствия данных
  noDataContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  noDataText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
}); 