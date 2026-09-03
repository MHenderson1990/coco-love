import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import * as favoritesApi from '../api/favorites';
import RichText from '../components/RichText';
import { ExtensionStorage } from '@bacons/apple-targets';
import * as affirmationsApi from '../api/affirmations';

let widgetStorage = new ExtensionStorage('group.com.coco.houseoflove');

export default function SavedScreen({ navigation }) {
  let { colors } = useTheme();
  let [items, setItems] = useState([]);
  let [loading, setLoading] = useState(true);
  let [pinnedId, setPinnedId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      setPinnedId(widgetStorage.get('widgetPinnedId'));
    }, [])
  );

  async function togglePin(item) {
    console.log('PIN DEBUG tapped, item:', JSON.stringify(item));
    let affirmationId = item.affirmation?._id;
    console.log('PIN DEBUG affirmationId:', affirmationId);
    if (!affirmationId) {
      console.log('PIN DEBUG bailing — no affirmationId');
      return;
    }

      if (pinnedId === affirmationId) {
      // unpin — leave widgetAffirmationText alone; it'll show whatever was last
      // actually revealed in-app until the next real reveal updates it
      widgetStorage.set('widgetIsPinned', 0);
      widgetStorage.set('widgetPinnedId', null);
      setPinnedId(null);
    } else {
      widgetStorage.set('widgetAffirmationText', item.affirmation.text);
      widgetStorage.set('widgetIsPinned', 1);
      widgetStorage.set('widgetPinnedId', affirmationId);
      setPinnedId(affirmationId);
    }
    ExtensionStorage.reloadWidget();
  }

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
    <SafeAreaView style={[styles.wrap, { backgroundColor: 'transparent' }]} edges={['top']}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={[styles.back, { color: colors.muted }]}>‹ Back</Text>
      </Pressable>
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
          renderItem={({ item }) => {
            let isPinned = pinnedId === item.affirmation?._id;
            return (
              <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                <RichText style={[styles.text, { color: colors.ink }]} text={item.affirmation?.text} />
                <View style={styles.rowFooter}>
                  <Text style={[styles.meta, { color: colors.muted }]}>
                    Saved {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                  <Pressable onPress={() => togglePin(item)} hitSlop={8}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isPinned ? colors.accent : colors.muted }}>
                      {isPinned ? 'PINNED TO WIDGET ✓' : 'Pin to widget'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
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
  text: { fontSize: 15, lineHeight: 21 },
  meta: { fontSize: 11 },
  rowFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});