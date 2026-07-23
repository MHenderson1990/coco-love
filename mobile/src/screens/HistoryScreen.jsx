import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import * as affirmationsApi from '../api/affirmations';

export default function HistoryScreen() {
  let { colors } = useTheme();
  let [items, setItems] = useState([]);
  let [loading, setLoading] = useState(true);

  useEffect(() => {
    affirmationsApi.getHistory()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  function formatDate(value) {
    let date = new Date(value);
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    let diff = Math.round((today - new Date(date).setHours(0, 0, 0, 0)) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: colors.bg }]} edges={['top']}>
      <Text style={[styles.title, { color: colors.ink }]}>Past messages</Text>
      <Text style={[styles.sub, { color: colors.muted }]}>Everything you've opened, newest first.</Text>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.muted }]}>
              Your first message will appear here tomorrow morning.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <Text style={[styles.date, { color: colors.accent }]}>
                {formatDate(item.scheduledDate).toUpperCase()}
              </Text>
              <Text style={[styles.text, { color: colors.ink }]}>{item.text}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

let styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 22 },
  title: { fontSize: 24, fontWeight: '500', marginTop: 18, letterSpacing: -0.4 },
  sub: { fontSize: 13.5, marginTop: 5, marginBottom: 16 },
  list: { gap: 9, paddingBottom: 24 },
  row: { borderWidth: 1, borderRadius: 15, padding: 15 },
  date: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 7 },
  text: { fontSize: 15, lineHeight: 21 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14, lineHeight: 21 },
});