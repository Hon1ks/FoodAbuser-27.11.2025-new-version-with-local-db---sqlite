import * as React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, useTheme, Surface, HelperText, IconButton, Menu, Divider } from 'react-native-paper';
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
          <Surface style={styles.surface} elevation={4}>
            <Text style={styles.title}>Добавить приём пищи</Text>
            <View style={styles.row}>
              <Button
                icon="camera"
                mode="outlined"
                style={styles.mediaBtn}
                onPress={() => {}}
              >
                Камера
              </Button>
              <Button
                icon="image"
                mode="outlined"
                style={styles.mediaBtn}
                onPress={() => {}}
              >
                Галерея
              </Button>
            </View>
            <TextInput
              label="Описание блюда"
              value={description}
              onChangeText={setDescription}
              style={styles.input}
              multiline
              left={<TextInput.Icon icon="note-text-outline" />}
              error={!!error && !description.trim()}
            />
            <View style={styles.row}>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    icon={categories.find(c => c.value === category).icon}
                    onPress={() => setMenuVisible(true)}
                    style={styles.catBtn}
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
              <Button
                mode="outlined"
                icon="clock-outline"
                onPress={() => setShowDate(true)}
                style={[styles.catBtn, {marginLeft: 0}]}
                labelStyle={{fontSize: 16, fontWeight: 'bold'}}
              >
                {date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </Button>
              {showDate && (
                <DateTimePicker
                  value={date}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={(_, selectedDate) => {
                    setShowDate(false);
                    if (selectedDate) setDate(selectedDate);
                  }}
                />
              )}
            </View>
            <TextInput
              label="Размер порции (г)"
              value={portion}
              onChangeText={setPortion}
              keyboardType="numeric"
              style={styles.input}
              left={<TextInput.Icon icon="scale" />}
              error={!!error && (!portion.trim() || isNaN(Number(portion)))}
            />
            {error ? <HelperText type="error" visible>{error}</HelperText> : null}
            <Button
              mode="contained"
              style={styles.saveBtn}
              onPress={handleSave}
              contentStyle={{height: 48}}
              labelStyle={{fontWeight: 'bold', fontSize: 17}}
            >
              Сохранить
            </Button>
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>
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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6C63FF',
    marginBottom: 18,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    marginRight: 8,
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
}); 