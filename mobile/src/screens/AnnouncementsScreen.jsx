import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import * as announcementsApi from '../api/announcements';

export default function AnnouncementsScreen({ navigation }) {
  let { colors } = useTheme();
  let [items, setItems] = useState([]);
  let [loading, setLoading] = useState(true);

  useEffect(() => {
    announcementsApi.listAnnouncements()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: colors.bg }]} edges={['top']}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={[styles.back, { color: colors.muted }]}>‹ Back</Text>
      </Pressable>

      <Text style={[styles.title, { color: colors.ink }]}>From Coco</Text>
      <Text style={[styles.sub, { color: colors.muted }]}>News and notes for everyone.</Text>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.muted }]}>Nothing yet.</Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <Text style={[styles.date, { color: colors.accent }]}>
                {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
              </Text>
              <Text style={[styles.rowTitle, { color: colors.ink }]}>{item.title}</Text>
              <Text style={[styles.rowBody, { color: colors.muted }]}>{item.body}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

let styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 22 },
  back: { fontSize: 15, marginTop: 12, marginBottom: 6 },
  title: { fontSize: 24, fontWeight: '500', letterSpacing: -0.4 },
  sub: { fontSize: 13.5, marginTop: 5, marginBottom: 16 },
  list: { gap: 9, paddingBottom: 24 },
  row: { borderWidth: 1, borderRadius: 15, padding: 15 },
  date: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 7 },
  rowTitle: { fontSize: 15, fontWeight: '600', marginBottom: 5 },
  rowBody: { fontSize: 13.5, lineHeight: 20 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});