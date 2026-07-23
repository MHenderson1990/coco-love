import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import * as videosApi from '../api/videos';

export default function WatchScreen() {
  let { colors } = useTheme();
  let [items, setItems] = useState([]);
  let [loading, setLoading] = useState(true);

  useEffect(() => {
    videosApi.listVideos()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  function formatDuration(seconds) {
    if (!seconds) return '';
    let m = Math.floor(seconds / 60);
    let s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: colors.bg }]} edges={['top']}>
      <Text style={[styles.title, { color: colors.ink }]}>Watch</Text>
      <Text style={[styles.sub, { color: colors.muted }]}>Longer sessions, whenever you want them.</Text>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.muted }]}>
              New sessions will show up here.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.line }]}
              onPress={() => Linking.openURL(item.videoUrl)}
            >
              <View style={[styles.thumb, { backgroundColor: colors.accentSoft }]}>
                <View style={[styles.play, { backgroundColor: colors.surface }]}>
                  <Text style={{ color: colors.accent, fontSize: 13 }}>▶</Text>
                </View>
                {item.duration ? (
                  <Text style={styles.dur}>{formatDuration(item.duration)}</Text>
                ) : null}
              </View>
              <View style={styles.meta}>
                <Text style={[styles.vidTitle, { color: colors.ink }]}>{item.title}</Text>
                {item.description ? (
                  <Text style={[styles.vidSub, { color: colors.muted }]} numberOfLines={1}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
            </Pressable>
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
  list: { gap: 10, paddingBottom: 24 },
  row: { borderWidth: 1, borderRadius: 15, overflow: 'hidden' },
  thumb: { height: 90, alignItems: 'center', justifyContent: 'center' },
  play: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dur: {
    position: 'absolute', right: 10, bottom: 8, color: '#fff', fontSize: 10, fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 100,
  },
  meta: { padding: 13 },
  vidTitle: { fontSize: 14.5, fontWeight: '600' },
  vidSub: { fontSize: 12, marginTop: 3 },
});