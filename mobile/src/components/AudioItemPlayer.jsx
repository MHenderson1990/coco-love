import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { useTheme } from '../context/ThemeContext';
import * as audioApi from '../api/audio';

function fmt(s) {
  let m = Math.floor((s || 0) / 60);
  return `${m}:${String(Math.floor((s || 0) % 60)).padStart(2, '0')}`;
}

export default function AudioItemPlayer({ audioId }) {
  let { colors } = useTheme();
  let [url, setUrl] = useState(null);
  let [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true });
        let u = await audioApi.getPlayUrl(audioId);
        if (active) setUrl(u);
      } catch (err) {
        if (active) setError(err.response?.data?.error || 'Could not load this audio.');
      }
    })();
    return () => { active = false; };
  }, [audioId]);

  if (error) {
    return <Text style={[styles.msg, { color: colors.muted }]}>{error}</Text>;
  }

  if (!url) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return <LoadedPlayer url={url} colors={colors} />;
}

function LoadedPlayer({ url, colors }) {
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

  function skip(delta) {
    let next = Math.min(Math.max(cur + delta, 0), dur || cur + delta);
    player.seekTo(next);
  }

  let pct = dur > 0 ? (cur / dur) * 100 : 0;

  return (
    <View style={styles.wrap}>
      <View style={[styles.track, { backgroundColor: colors.line }]}>
        <View style={[styles.fill, { backgroundColor: colors.accent, width: `${pct}%` }]} />
      </View>
      <View style={styles.controls}>
        <Text style={[styles.time, { color: colors.muted }]}>{fmt(cur)}</Text>
        <Pressable onPress={() => skip(-10)} hitSlop={10}>
        <MaterialIcons name="replay-10" size={28} color={colors.muted} />
        </Pressable>
        <Pressable onPress={toggle} hitSlop={10} style={[styles.playBtn, { backgroundColor: colors.accent }]}>
          <Ionicons name={playing ? 'pause' : 'play'} size={20} color="#fff" />
        </Pressable>
        <Pressable onPress={() => skip(10)} hitSlop={10}>
        <MaterialIcons name="forward-10" size={28} color={colors.muted} />
        </Pressable>
        <Text style={[styles.time, { color: colors.muted }]}>{fmt(dur)}</Text>
      </View>
    </View>
  );
}

let styles = StyleSheet.create({
  wrap: { paddingTop: 12 },
  loading: { paddingTop: 14, alignItems: 'center' },
  msg: { fontSize: 12.5, paddingTop: 12 },
  track: { height: 4, borderRadius: 100, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 100 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  playBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  time: { fontSize: 11, fontVariant: ['tabular-nums'], minWidth: 34, textAlign: 'center' },
});