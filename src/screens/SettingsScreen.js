import * as React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, useTheme, List, Switch } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

export default function SettingsScreen() {
  const theme = useTheme();
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

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
        <Card style={styles.card}>
          <Card.Content>
            <List.Section>
              <List.Item
                title="Уведомления"
                left={props => <List.Icon {...props} icon="bell-outline" />}
                right={() => (
                  <Switch value={notifications} onValueChange={setNotifications} />
                )}
              />
              <List.Item
                title="Тёмная тема"
                left={props => <List.Icon {...props} icon="theme-light-dark" />}
                right={() => (
                  <Switch value={darkMode} onValueChange={setDarkMode} />
                )}
              />
              <List.Item
                title="Экспорт данных"
                left={props => <List.Icon {...props} icon="file-export-outline" />}
                onPress={() => {}}
              />
              <List.Item
                title="Цели и предпочтения"
                left={props => <List.Icon {...props} icon="target" />}
                onPress={() => {}}
              />
            </List.Section>
          </Card.Content>
        </Card>
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
}); 