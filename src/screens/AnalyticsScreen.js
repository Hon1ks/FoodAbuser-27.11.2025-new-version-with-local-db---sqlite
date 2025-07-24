import * as React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

export default function AnalyticsScreen() {
  const theme = useTheme();
  return (
    <View style={styles.flex}>
      <LinearGradient
        colors={["#1230c7de", "#000000", "#15c712de"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Аналитика</Text>
        {/* Здесь будут графики и рекомендации */}
        <Card style={styles.card}>
          <Card.Content>
            <Text>Здесь появится ваша аналитика и рекомендации.</Text>
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