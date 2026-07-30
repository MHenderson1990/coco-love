import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { useTheme } from '../context/ThemeContext';
import * as journalApi from '../api/journal';
import ShareVoiceButton from './ShareVoiceButton';

function fmt(s) {
  let m = Math.floor((s || 0) / 60);
  return `${m}:${String(Math.floor((s || 0) % 60)).padStart(2, '0')}`;
}

export default function VoiceNotePlayer({ voiceKey }) {
  let { colors } = useTheme();
  let [url, setUrl] = useState(null);
  let [loading, setLoading] = useState(false);

  async function start() {
    if (url || loading) return;
    setLoading(true);
    try {
      await setAudioModeAsync({ playsInSilentMode: true });
      let u = await journalApi.getVoicePlayUrl(voiceKey);
      setUrl(u);
    } catch (err) {
      // ignore; user can retap
    } finally {
      setLoading(false);
    }
  }

  if (!url) {
    return (
      <View style={[styles.bar, { backgroundColor: colors.bg, borderColor: colors.line }]}>
        <Pressable onPress={start} disabled={loading} style={styles.playRow} hitSlop={8}>
          {loading ? <ActivityIndicator color={colors.accent} /> : <Ionicons name="play" size={16} color={colors.accent} />}
          <Text style={[styles.label, { color: colors.muted }]}>{loading ? 'Loading…' : 'Voice note'}</Text>
        </Pressable>
        <ShareVoiceButton source={{ key: voiceKey }} label="" />
      </View>
    );
  }

  return <LoadedPlayer url={url} colors={colors} voiceKey={voiceKey} />;
}

function LoadedPlayer({ url, colors, voiceKey }) {
  let player = useAudioPlayer(url);
  let status = useAudioPlayerStatus(player);
  let playing = status?.playing ?? status?.isPlaying;
  let cur = status?.currentTime || 0;
  let dur = status?.duration || 0;

  useEffect(() => { player.play(); }, []); // auto-play once loaded

  function toggle() {
    if (playing) player.pause();
    else {
      if (dur > 0 && cur >= dur) player.seekTo(0);
      player.play();
    }
  }

  let pct = dur > 0 ? (cur / dur) * 100 : 0;

  return (
    <View style={[styles.bar, { backgroundColor: colors.bg, borderColor: colors.line }]}>
      <Pressable onPress={toggle} hitSlop={8}>
        <Ionicons name={playing ? 'pause' : 'play'} size={18} color={colors.accent} />
      </Pressable>
      <View style={[styles.track, { backgroundColor: colors.line }]}>
        <View style={[styles.fill, { backgroundColor: colors.accent, width: `${pct}%` }]} />
      </View>
      <Text style={[styles.time, { color: colors.muted }]}>{fmt(cur)} / {fmt(dur)}</Text>
      <ShareVoiceButton source={{ key: voiceKey }} label="" />
    </View>
  );
}

let styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 12 },
  label: { fontSize: 13, fontWeight: '600' },
  track: { flex: 1, height: 4, borderRadius: 100, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 100 },
  time: { fontSize: 11, fontVariant: ['tabular-nums'] },
  playRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
});