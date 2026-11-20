import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ActivityIndicator, Pressable, ScrollView, Alert,
  Image, Modal, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import * as videosApi from '../api/videos';
import * as audioApi from '../api/audio';
import AudioItemPlayer from '../components/AudioItemPlayer';
import { EXPLORE_CATEGORIES } from '../constants/exploreCategories';

let CARD = 132;

function formatDuration(seconds) {
  if (!seconds) return '';
  let m = Math.floor(seconds / 60);
  let s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function labelOf(item) {
  return item.kind === 'video' ? (item.description || item.title) : item.title;
}

function Thumb({ item, size, colors, big }) {
  let icon = item.kind === 'audio' ? 'headset' : 'play';
  return (
    <View
      style={[
        styles.thumb,
        { width: size, height: size, backgroundColor: colors.accentSoft, borderRadius: big ? 18 : 12 },
      ]}
    >
      {item.coverUrl ? (
        <Image source={{ uri: item.coverUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <Ionicons name={icon} size={big ? 44 : 28} color={colors.accent} />
      )}
      {item.coverUrl ? (
        <View style={styles.typeBadge}>
          <Ionicons name={icon} size={11} color="#fff" />
        </View>
      ) : null}
      {item.locked ? (
        <View style={styles.lockBadge}>
          <Ionicons name="lock-closed" size={11} color="#fff" />
        </View>
      ) : null}
      {!big && item.duration ? (
        <Text style={styles.dur}>{formatDuration(item.duration)}</Text>
      ) : null}
    </View>
  );
}

export default function WatchScreen({ navigation }) {
  let { colors } = useTheme();
  let { width } = useWindowDimensions();
  let [videos, setVideos] = useState([]);
  let [audio, setAudio] = useState([]);
  let [videosLoading, setVideosLoading] = useState(true);
  let [audioLoading, setAudioLoading] = useState(true);
  let [playing, setPlaying] = useState(null);
  let [section, setSection] = useState('video');
  let [seeAll, setSeeAll] = useState(null);

  // reload each time the tab is focused, so new uploads show up without restarting the app
  useFocusEffect(
    useCallback(() => {
      videosApi.listVideos()
        .then(setVideos)
        .catch(() => setVideos([]))
        .finally(() => setVideosLoading(false));
      audioApi.listAudio()
        .then(setAudio)
        .catch(() => setAudio([]))
        .finally(() => setAudioLoading(false));
    }, [])
  );

  let all = [
    ...videos.map((v) => ({ ...v, kind: 'video' })),
    ...audio.map((a) => ({ ...a, kind: 'audio' })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  let inSection = all.filter((i) => i.kind === section);
  let featured = all.find((i) => i.featured);
  let busy = videosLoading || audioLoading;
  let gridCard = Math.floor((width - 44 - 12) / 2);

  async function open(item) {
    if (item.locked) {
      navigation.navigate('Upgrade');
      return;
    }
    if (item.kind === 'audio') {
      setPlaying(item);
      return;
    }
    try {
      // new videos live in R2 and need a fresh signed link; old ones already have a URL
      let videoUrl = item.r2 ? await videosApi.getPlayUrl(item._id) : item.videoUrl;
      navigation.navigate('VideoPlayer', {
        videoUrl,
        title: item.title,
        description: item.description,
      });
    } catch (err) {
      Alert.alert('Could not open this video', err.response?.data?.error || 'Try again in a moment.');
    }
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
            onPress={() => { setSection(key); setSeeAll(null); }}
          >
            <Text style={[styles.segText, { color: section === key ? '#fff' : colors.muted }]}>
              {key === 'video' ? 'Video' : 'Audio'}
            </Text>
          </Pressable>
        ))}
      </View>

      {busy ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : inSection.length === 0 ? (
        <Text style={[styles.empty, { color: colors.muted }]}>
          {section === 'video' ? 'New sessions will show up here.' : 'New audio will show up here.'}
        </Text>
     ) : seeAll ? (
        <View style={{ flex: 1 }}>
          <Pressable onPress={() => setSeeAll(null)} style={styles.backRow} hitSlop={8}>
            <Ionicons name="chevron-back" size={18} color={colors.accent} />
            <Text style={{ color: colors.accent, fontSize: 14, fontWeight: '600' }}>Back</Text>
          </Pressable>
          <Text style={[styles.rowHead, { color: colors.ink, fontSize: 20 }]}>{seeAll}</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
            {inSection
              .filter((i) => (i.category || 'More') === seeAll)
              .map((item) => (
                <Pressable key={`${item.kind}-${item._id}`} style={{ width: gridCard }} onPress={() => open(item)}>
                  <Thumb item={item} size={gridCard} colors={colors} />
                  <Text style={[styles.cap, { color: colors.ink }]} numberOfLines={2}>
                    {labelOf(item)}
                  </Text>
                </Pressable>
              ))}
          </ScrollView>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {featured ? (
            <Pressable style={styles.featWrap} onPress={() => open(featured)}>
              <Thumb item={featured} size={width - 44} colors={colors} big />
              <View style={styles.featBand}>
                <Text style={styles.featLabel}>Featured</Text>
                <Text style={styles.featTitle} numberOfLines={2}>{labelOf(featured)}</Text>
              </View>
            </Pressable>
          ) : null}

          {EXPLORE_CATEGORIES.map((cat) => {
            let list = inSection.filter((i) => (i.category || 'More') === cat);
            if (!list.length) return null;
            return (
              <View key={cat} style={{ marginBottom: 20 }}>
                <View style={styles.rowHeadWrap}>
                  <Text style={[styles.rowHead, { color: colors.ink, marginBottom: 0 }]}>{cat}</Text>
                  {list.length > 2 ? (
                    <Pressable onPress={() => setSeeAll(cat)} hitSlop={8}>
                      <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '600' }}>See all</Text>
                    </Pressable>
                  ) : null}
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ flexGrow: 0, marginHorizontal: -22 }}
                  contentContainerStyle={{ gap: 12, paddingHorizontal: 22 }}
                >
                  {list.map((item) => (
                    <Pressable key={`${item.kind}-${item._id}`} style={{ width: CARD }} onPress={() => open(item)}>
                      <Thumb item={item} size={CARD} colors={colors} />
                      <Text style={[styles.cap, { color: colors.ink }]} numberOfLines={2}>
                        {labelOf(item)}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
      )}

      <Modal visible={!!playing} animationType="slide" transparent onRequestClose={() => setPlaying(null)}>
        <View style={styles.sheetWrap}>
          <Pressable style={styles.backdrop} onPress={() => setPlaying(null)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={styles.sheetHead}>
              <Text style={[styles.sheetTitle, { color: colors.ink }]} numberOfLines={2}>
                {playing?.title}
              </Text>
              <Pressable onPress={() => setPlaying(null)}>
                <Text style={{ color: colors.muted, fontSize: 20 }}>✕</Text>
              </Pressable>
            </View>
            {playing?.coverUrl ? (
              <Image source={{ uri: playing.coverUrl }} style={styles.sheetCover} resizeMode="cover" />
            ) : null}
            {playing?.description ? (
              <Text style={[styles.sheetDesc, { color: colors.muted }]}>{playing.description}</Text>
            ) : null}
            {playing ? <AudioItemPlayer audioId={playing._id} title={playing.title} /> : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

let styles = StyleSheet.create({
  wrap:     { flex: 1, paddingHorizontal: 22 },
  title:    { fontSize: 24, fontWeight: '500', marginTop: 18, letterSpacing: -0.4 },
  sub:      { fontSize: 13.5, marginTop: 5, marginBottom: 16 },
  empty:    { textAlign: 'center', marginTop: 40, fontSize: 13.5 },
  thumb:    { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  typeBadge: {
    position: 'absolute', left: 8, top: 8, width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute', right: 8, top: 8, width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  dur: {
    position: 'absolute', right: 8, bottom: 8, color: '#fff', fontSize: 10, fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 100,
  },
  featWrap: { marginBottom: 22, borderRadius: 18, overflow: 'hidden' },
  featBand: {
    position: 'absolute', left: 0, right: 0, bottom: 0, padding: 14,
    backgroundColor: 'rgba(20,10,40,0.5)',
  },
  featLabel: { color: '#fff', fontSize: 11, fontWeight: '600', letterSpacing: 0.6, opacity: 0.85 },
  featTitle: { color: '#fff', fontSize: 17, fontFamily: 'PlayfairDisplay_500Medium', marginTop: 3 },
  rowHead:  { fontSize: 17, fontFamily: 'PlayfairDisplay_500Medium', marginBottom: 10 },
  cap:      { fontSize: 12.5, lineHeight: 17, marginTop: 6 },

  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 34 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 },
  sheetTitle: { flex: 1, fontSize: 18, fontFamily: 'PlayfairDisplay_500Medium' },
  sheetCover: { width: '100%', aspectRatio: 1, borderRadius: 16, marginBottom: 14 },
  sheetDesc: { fontSize: 13.5, lineHeight: 19, marginBottom: 12 },
  toggle:   { flexDirection: 'row', borderWidth: 1, borderRadius: 100, padding: 3, marginBottom: 16 },
  seg:      { flex: 1, paddingVertical: 8, borderRadius: 100, alignItems: 'center' },
  segText:  { fontSize: 13, fontWeight: '600' },
  rowHeadWrap: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 },
  backRow:  { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 8 },
  grid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 24 },
});