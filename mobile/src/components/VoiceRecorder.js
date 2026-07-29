import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useAudioRecorder, useAudioRecorderState, RecordingPresets,
  useAudioPlayer, useAudioPlayerStatus,
  AudioModule, setAudioModeAsync,
} from 'expo-audio';
import { useTheme } from '../context/ThemeContext';

function fmt(ms) {
  let s = Math.floor((ms || 0) / 1000);
  let m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export default function VoiceRecorder({ onSave, onDiscard }) {
  let { colors } = useTheme();
  let recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  let recState = useAudioRecorderState(recorder);
  let [uri, setUri] = useState(null);
  let [ready, setReady] = useState(false);
  let [levels, setLevels] = useState([]);
  let meterRef = useRef(-160);
  meterRef.current = recState.metering ?? -160;

  useEffect(() => {
    if (!recState.isRecording) return;
    let id = setInterval(() => {
      let norm = Math.max(0, Math.min(1, (meterRef.current + 60) / 60));
      setLevels((prev) => {
        let next = prev.concat(norm);
        return next.length > 44 ? next.slice(-44) : next;
      });
    }, 120);
    return () => clearInterval(id);
  }, [recState.isRecording]);

  useEffect(() => {
    (async () => {
      let status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Microphone needed', 'Enable microphone access in Settings to record.');
        return;
      }
      await setAudioModeAsync({ playsInSilentMode: true });
      setReady(true);
    })();
  }, []);

  async function start() {
    setLevels([]);
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  }

  async function stop() {
    await recorder.stop();
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
    setUri(recorder.uri);
  }

  if (uri) {
    return (
      <Playback
        uri={uri}
        key={uri}
        colors={colors}
        onRerecord={() => { setLevels([]); setUri(null); }}
        onDiscard={() => { setLevels([]); setUri(null); onDiscard?.(); }}
        onSave={() => onSave?.(uri)}
      />
    );
  }

  let recording = recState.isRecording;
  let paused = !recording && recState.durationMillis > 0 && recState.canRecord;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg, borderColor: colors.line }]}>
      {levels.length > 0 ? <Waveform levels={levels} colors={colors} active={recording} /> : null}
      <Text style={[styles.timer, { color: colors.ink }]}>{fmt(recState.durationMillis)}</Text>

      <View style={styles.controls}>
        {!recording && !paused ? (
          <Pressable style={[styles.mic, { backgroundColor: colors.accent, opacity: ready ? 1 : 0.4 }]} onPress={start} disabled={!ready}>
            <Ionicons name="mic" size={26} color={colors.surface} />
          </Pressable>
        ) : (
          <>
            <Pressable style={[styles.ctrl, { borderColor: colors.line }]} onPress={() => (recording ? recorder.pause() : recorder.record())}>
              <Ionicons name={recording ? 'pause' : 'mic'} size={22} color={colors.accent} />
            </Pressable>
            <Pressable style={[styles.stop, { backgroundColor: colors.accent }]} onPress={stop}>
              <Ionicons name="stop" size={22} color={colors.surface} />
            </Pressable>
          </>
        )}
      </View>

      <Text style={[styles.hint, { color: colors.muted }]}>
        {recording ? 'Recording…' : paused ? 'Paused' : ready ? 'Tap to record' : 'Preparing…'}
      </Text>
    </View>
  );
}

function Playback({ uri, colors, onRerecord, onDiscard, onSave }) {
  let player = useAudioPlayer(uri);
  let status = useAudioPlayerStatus(player);

  let cur = status?.currentTime || 0;
  let dur = status?.duration || 0;
  let playing = status?.playing ?? status?.isPlaying;

  function toggle() {
    if (playing) player.pause();
    else {
      if (dur > 0 && cur >= dur) player.seekTo(0);
      player.play();
    }
  }

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg, borderColor: colors.line }]}>
      <Text style={[styles.timer, { color: colors.ink }]}>{fmt(cur * 1000)} / {fmt(dur * 1000)}</Text>

      <View style={styles.controls}>
        <Pressable style={[styles.ctrl, { borderColor: colors.line }]} onPress={() => player.seekTo(Math.max(0, cur - 10))}>
          <Ionicons name="play-back" size={20} color={colors.accent} />
        </Pressable>
        <Pressable style={[styles.mic, { backgroundColor: colors.accent }]} onPress={toggle}>
          <Ionicons name={playing ? 'pause' : 'play'} size={24} color={colors.surface} />
        </Pressable>
        <Pressable style={[styles.ctrl, { borderColor: colors.line }]} onPress={() => player.seekTo(Math.min(dur, cur + 10))}>
          <Ionicons name="play-forward" size={20} color={colors.accent} />
        </Pressable>
      </View>

      <View style={styles.reviewRow}>
        <Pressable onPress={onDiscard} hitSlop={8}>
          <Text style={[styles.discard, { color: colors.muted }]}>Discard</Text>
        </Pressable>
        <Pressable onPress={onRerecord} hitSlop={8}>
          <Text style={[styles.reRec, { color: colors.muted }]}>Re-record</Text>
        </Pressable>
        <Pressable style={[styles.useBtn, { backgroundColor: colors.accent }]} onPress={onSave}>
          <Text style={[styles.useText, { color: colors.surface }]}>Use recording</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Waveform({ levels, colors, active }) {
  return (
    <View style={styles.wave}>
      {levels.map((v, i) => (
        <View
          key={i}
          style={{ width: 3, borderRadius: 2, height: 4 + v * 38, backgroundColor: active ? colors.accent : colors.muted }}
        />
      ))}
    </View>
  );
}

let styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 16 },
  timer: { fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'], marginBottom: 14 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  mic: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  ctrl: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stop: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 12, marginTop: 12 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', marginTop: 16 },
  reRec: { fontSize: 13, fontWeight: '600' },
  useBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  useText: { fontSize: 13, fontWeight: '700' },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 46, marginBottom: 12 },
  discard: { fontSize: 13, fontWeight: '600' },
});