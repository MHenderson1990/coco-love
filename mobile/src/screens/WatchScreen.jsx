import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import * as videosApi from '../api/videos';
import * as audioApi from '../api/audio';
import AudioItemPlayer from '../components/AudioItemPlayer';
import { EXPLORE_CATEGORIES } from '../constants/exploreCategories';

export default function WatchScreen({ navigation }) {
  let { colors } = useTheme();
  let [items, setItems] = useState([]);
  let [loading, setLoading] = useState(true);
  let [section, setSection] = useState('video');
  let [category, setCategory] = useState('All');
  let [audioItems, setAudioItems] = useState([]);
  let [audioLoading, setAudioLoading] = useState(true);
  let [openAudioId, setOpenAudioId] = useState(null);

  let shown = category === 'All'
    ? items
    : items.filter((v) => (v.category || 'More') === category);

  let shownAudio = category === 'All'
    ? audioItems
    : audioItems.filter((a) => (a.category || 'More') === category);

  

  // reload each time the tab is focused, so new uploads show up without restarting the app
  useFocusEffect(
    useCallback(() => {
      videosApi.listVideos()
        .then(setItems)
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
      audioApi.listAudio()
        .then(setAudioItems)
        .catch(() => setAudioItems([]))
        .finally(() => setAudioLoading(false));
    }, [])
  );

  function formatDuration(seconds) {
    if (!seconds) return '';
    let m = Math.floor(seconds / 60);
    let s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: 'transparent' }]} edges={['top']}>
      <Text style={[styles.title, { color: colors.ink }]}>Explore</Text>
      <Text style={[styles.sub, { color: colors.muted }]}>Video, audio and more, whenever you want them.</Text>

      <View style={[styles.toggle, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        {['video', 'audio'].map((key) => (
          <Pressable
            key={key}
            style={[styles.seg, section === key && { backgroundColor: colors.accent }]}
            onPress={() => setSection(key)}
          >
            <Text style={[styles.segText, { color: section === key ? '#fff' : colors.muted }]}>
              {key === 'video' ? 'Video' : 'Audio'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.chipRow}
      >
        {['All', ...EXPLORE_CATEGORIES].map((c) => (
          <Pressable
            key={c}
            style={[
              styles.chip,
              { borderColor: colors.line, backgroundColor: colors.surface },
              category === c && { backgroundColor: colors.accent, borderColor: colors.accent },
            ]}
            onPress={() => setCategory(c)}
          >
            <Text style={{ color: category === c ? '#fff' : colors.muted, fontSize: 12.5, fontWeight: '600' }}>
              {c}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {section === 'audio' ? (
        audioLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={shownAudio}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: colors.muted }]}>
                {category === 'All' ? 'New audio will show up here.' : `No ${category.toLowerCase()} audio yet.`}
              </Text>
            }
            renderItem={({ item }) => {
              let open = openAudioId === item._id;
              return (
                <View style={[styles.audioCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                  <Pressable
                    style={styles.audioHead}
                    onPress={() => {
                      if (item.locked) {
                        navigation.navigate('Upgrade');
                        return;
                      }
                      setOpenAudioId(open ? null : item._id);
                    }}
                  >
                    <View style={[styles.audioIcon, { backgroundColor: colors.accentSoft }]}>
                      <Text style={{ color: colors.accent, fontSize: 15 }}>{open ? '❚❚' : '♪'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.vidTitle, { color: colors.ink }]}>{item.title}</Text>
                      <Text style={[styles.vidSub, { color: colors.muted }]} numberOfLines={1}>
                        {item.category || 'More'}{item.description ? ` · ${item.description}` : ''}
                      </Text>
                    </View>
                    {item.locked ? <Text style={{ color: colors.muted, fontSize: 11.5, fontWeight: '600' }}>Members</Text> : null}
                  </Pressable>
                  {open ? <AudioItemPlayer audioId={item._id} /> : null}
                </View>
              );
            }}
          />
        )
      ) : loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.muted }]}>
              {category === 'All' ? 'New sessions will show up here.' : `No ${category.toLowerCase()} sessions yet.`}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.line }]}
              onPress={() => {
                navigation.navigate('VideoPlayer', {
                  videoUrl: item.videoUrl,
                  title: item.title,
                  description: item.description,
                });
              }}
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
  wrap:     { flex: 1, paddingHorizontal: 22 },
  title:    { fontSize: 24, fontWeight: '500', marginTop: 18, letterSpacing: -0.4 },
  sub:      { fontSize: 13.5, marginTop: 5, marginBottom: 16 },
  list:     { gap: 10, paddingBottom: 24 },
  row:      { borderWidth: 1, borderRadius: 15, overflow: 'hidden' },
  thumb:    { height: 90, alignItems: 'center', justifyContent: 'center' },
  play:     { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dur:      {
    position: 'absolute', right: 10, bottom: 8, color: '#fff', fontSize: 10, fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 100,
  },
  meta:     { padding: 13 },
  vidTitle: { fontSize: 14.5, fontWeight: '600' },
  vidSub:   { fontSize: 12, marginTop: 3 },
  badge:    { position: 'absolute', left: 10, top: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  audioCard: { borderWidth: 1, borderRadius: 15, padding: 13 },
  audioHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  audioIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  chipRow:  { gap: 8, paddingBottom: 14 },
  chip:     { borderWidth: 1, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 7 },
  toggle:   { flexDirection: 'row', borderWidth: 1, borderRadius: 100, padding: 3, marginBottom: 14 },
  seg:      { flex: 1, paddingVertical: 8, borderRadius: 100, alignItems: 'center' },
  segText:  { fontSize: 13, fontWeight: '600' },
  empty:    { textAlign: 'center', marginTop: 40, fontSize: 13.5 },
});