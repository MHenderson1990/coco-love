import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import RichText from '../components/RichText';
import * as adminApi from '../api/admin';
import MonthFilter from '../components/MonthFilter';

export default function EngagementScreen({ navigation }) {
  let { colors } = useTheme();
  let [items, setItems] = useState([]);
  let [loading, setLoading] = useState(true);
  let [month, setMonth] = useState(null); // null = all time

  let load = useCallback(() => {
  let active = true;

  setLoading(true);

  adminApi.getEngagement()
    .then((data) => {
      if (active) {
        setItems(Array.isArray(data) ? data : []);
      }
    })
    .catch((error) => {
      console.error(
        'Failed to load engagement:',
        error?.response?.data || error?.message
      );

      if (active) {
        setItems([]);
      }
    })
    .finally(() => {
      if (active) {
        setLoading(false);
      }
    });

  return () => {
    active = false;
  };
}, []);

  useFocusEffect(load);


    let shown = month
    ? items.filter((a) => {
        if (!a.scheduledDate) return false;
        let d = new Date(a.scheduledDate);
        return d.getUTCFullYear() === month.getFullYear() && d.getUTCMonth() === month.getMonth();
      })
    : items;

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: 'transparent' }]} edges={['top']}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={[styles.back, { color: colors.muted }]}>‹ Back</Text>
      </Pressable>
      <Text style={[styles.title, { color: colors.ink }]}>Who's loving what</Text>
      <Text style={[styles.sub, { color: colors.muted }]}>Tap a message to see who saved it. Most-saved first.</Text>

      <MonthFilter value={month} onChange={setMonth} />

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.muted }]}>No messages yet.</Text>}
          renderItem={({ item }) => <Row item={item} colors={colors} />}
        />
      )}
    </SafeAreaView>
  );
}

function Row({ item, colors }) {
  let [open, setOpen] = useState(false);
  let [savers, setSavers] = useState(null);
  let [loading, setLoading] = useState(false);

  async function toggle() {
    let next = !open;
    setOpen(next);
    if (next && savers === null) {
      setLoading(true);
      try {
        setSavers(await adminApi.getSavers(item._id));
      } catch {
        setSavers([]);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <Pressable
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.line }]}
      onPress={toggle}
    >
      <RichText
        style={[styles.text, { color: colors.ink }]}
        numberOfLines={open ? undefined : 2}
        text={item.text}
        />
      <Text style={[styles.meta, { color: colors.muted }]}>
        {item.favoriteCount} saved · {item.moreCount} more · {item.lessCount} less
      </Text>

      {open ? (
        loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 10 }} />
        ) : savers && savers.length ? (
          <View style={styles.savers}>
            <Text style={[styles.saversLabel, { color: colors.muted }]}>SAVED BY</Text>
            {savers.map((s, i) => (
              <Text key={i} style={[styles.saverName, { color: colors.ink }]}>{s.name}</Text>
            ))}
          </View>
        ) : (
          <Text style={[styles.saverName, { color: colors.muted, marginTop: 8 }]}>No one's saved this yet.</Text>
        )
      ) : null}
    </Pressable>
  );
}

let styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 22 },
  back: { fontSize: 15, marginTop: 12, marginBottom: 6 },
  title: { fontSize: 24, fontWeight: '500', letterSpacing: -0.4 },
  sub: { fontSize: 13.5, marginTop: 5, marginBottom: 16 },
  list: { gap: 9, paddingBottom: 24 },
  row: { borderWidth: 1, borderRadius: 15, padding: 15 },
  text: { fontSize: 14.5, lineHeight: 20 },
  meta: { fontSize: 11.5, marginTop: 8, fontWeight: '600' },
  savers: { marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)', paddingTop: 10, gap: 4 },
  saversLabel: { fontSize: 9.5, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  saverName: { fontSize: 13.5, lineHeight: 19 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});