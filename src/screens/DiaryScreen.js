import * as React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, useTheme, Button, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import { Avatar } from 'react-native-paper';

const mealTypes = [
  { label: 'Все', value: 'all' },
  { label: 'Завтрак', value: 'breakfast' },
  { label: 'Обед', value: 'lunch' },
  { label: 'Ужин', value: 'dinner' },
  { label: 'Перекус', value: 'snack' },
];

const meals = [
  { id: 1, type: 'breakfast', time: '08:30', title: 'Овсянка с фруктами', kcal: 320, date: '2025-07-25' },
  { id: 2, type: 'lunch', time: '13:10', title: 'Курица с рисом', kcal: 540, date: '2025-07-25' },
  { id: 3, type: 'dinner', time: '19:00', title: 'Салат с тунцом', kcal: 410, date: '2025-07-25' },
  { id: 4, type: 'snack', time: '16:00', title: 'Орехи', kcal: 150, date: '2025-07-24' },
];

export default function DiaryScreen() {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [filter, setFilter] = React.useState('all');

  const filteredMeals = meals.filter(
    m => m.date === selectedDate && (filter === 'all' || m.type === filter)
  );

  return (
    <View style={styles.flex}>
      <LinearGradient
        colors={["#1230c7de", "#000000", "#15c712de"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Дневник питания</Text>
        <Card style={styles.card}>
          <Card.Content>
            <Calendar
              current={selectedDate}
              onDayPress={day => setSelectedDate(day.dateString)}
              markedDates={{ [selectedDate]: { selected: true, selectedColor: '#43cea2' } }}
              theme={{
                backgroundColor: 'transparent',
                calendarBackground: 'transparent',
                todayTextColor: '#6C63FF',
                selectedDayBackgroundColor: '#43cea2',
                selectedDayTextColor: '#fff',
                arrowColor: '#6C63FF',
                monthTextColor: '#232634',
                textMonthFontWeight: 'bold',
                textDayFontWeight: 'bold',
                textDayHeaderFontWeight: 'bold',
              }}
              style={{ borderRadius: 12 }}
            />
          </Card.Content>
        </Card>
        <View style={styles.filterRow}>
          {mealTypes.map(mt => (
            <Chip
              key={mt.value}
              selected={filter === mt.value}
              onPress={() => setFilter(mt.value)}
              style={styles.chip}
              textStyle={{ fontWeight: 'bold' }}
            >
              {mt.label}
            </Chip>
          ))}
        </View>
        {filteredMeals.length === 0 ? (
          <Text style={styles.emptyText}>Нет приёмов пищи за выбранный день.</Text>
        ) : (
          filteredMeals.map(meal => (
            <Card key={meal.id} style={styles.mealCard}>
              <Card.Title
                title={meal.title}
                subtitle={`${meal.time}  •  ${meal.kcal} ккал`}
                left={props => (
                  <Avatar.Icon
                    {...props}
                    icon={
                      meal.type === 'breakfast'
                        ? 'food-croissant'
                        : meal.type === 'lunch'
                        ? 'food'
                        : meal.type === 'dinner'
                        ? 'food-apple'
                        : 'cookie'
                    }
                    color="#fff"
                    style={{ backgroundColor: '#6C63FF' }}
                  />
                )}
                right={props => (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Button icon="pencil" onPress={() => {}} compact />
                    <Button icon="delete" onPress={() => {}} compact />
                  </View>
                )}
              />
            </Card>
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6C63FF',
    marginBottom: 18,
    textAlign: 'center',
  },
  card: {
    borderRadius: 18,
    backgroundColor: '#fff',
    marginBottom: 18,
    padding: 12,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  chip: {
    marginHorizontal: 4,
    marginBottom: 4,
    backgroundColor: '#f6f6fa',
  },
  mealCard: {
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginVertical: 24,
    fontSize: 16,
  },
}); 