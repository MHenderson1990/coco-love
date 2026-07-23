import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import * as favoritesApi from '../api/favorites';

export default function SavedScreen() {
  let { colors } = useTheme();
  let [items, setItems] = useState([]);
  let [loading, setLoading] = useState(true);

  // refetch each time the tab is focused, so newly saved items show up
  useFocusEffect(
    useCallback(() => {
      let active = true;
      favoritesApi.listFavorites()
        .then((data) => { if (active) setItems(data); })
        .catch(() => { if (active) setItems([]); })
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }, [])
  );

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: colors.bg }]} edges={['top']}>
      <Text style={[styles.title, { color: colors.ink }]}>Saved messages</Text>
      <Text style={[styles.sub, { color: colors.muted }]}>The ones you keep coming back to.</Text>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.muted }]}>
              Tap Save on a message to keep it here.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <Text style={[styles.text, { color: colors.ink }]}>{item.affirmation?.text}</Text>
              <Text style={[styles.meta, { color: colors.muted }]}>
                Saved {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
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
  text: { fontSize: 15, lineHeight: 21 },
  meta: { fontSize: 11, marginTop: 8 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});