import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, LayoutAnimation, Platform, UIManager, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import VoiceRecorder from './VoiceRecorder';
import * as journalApi from '../api/journal';
import { BlurView } from 'expo-blur';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

let MOODS = ['🥹', '😢', '🤗', '😌', '🤬'];

export default function JournalDrawer({ affirmationId, onOpenChange }) {
  let { colors } = useTheme();
  let { user } = useAuth();
  let isPaid = user?.tier === 'paid';
  let [voiceNote, setVoiceNote] = useState(null); // { key }
  let [voiceBusy, setVoiceBusy] = useState(false);
  let voiceRef = useRef(null);
  voiceRef.current = voiceNote;

  // if the screen closes with an unsaved recording, delete it so it doesn't sit in storage
  useEffect(() => () => {
    if (voiceRef.current?.key) journalApi.destroyVoice(voiceRef.current.key);
  }, []);

  let [open, setOpen] = useState(false);
  let [mood, setMood] = useState(null);
  let [text, setText] = useState('');
  let [saving, setSaving] = useState(false);
  let [saved, setSaved] = useState(false);

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    let next = !open;
    setOpen(next);
    onOpenChange?.(next);
  }

  async function handleSave() {
    if (!mood && !text.trim() && !voiceNote) return;
    setSaving(true);
    try {
      await journalApi.createEntry(affirmationId, mood, text.trim(), voiceNote || undefined);
      setSaved(true);
      setText('');
      setMood(null);
      setVoiceNote(null);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      // non-blocking
    } finally {
      setSaving(false);
    }
  }

  return (
    <BlurView
      intensity={30}
      tint="dark"
      style={[styles.wrap, Platform.OS === 'android' && { backgroundColor: 'rgba(0,0,0,0.5)' }]}
    >
      <Pressable style={styles.head} onPress={toggle}>
        <Text style={[styles.headText, { color: '#fff' }]}>
          {saved ? 'Entry saved' : 'Add to your journal'}
        </Text>
        <Text style={[styles.chev, { color: 'rgba(255,255,255,0.8)' }]}>{open ? '⌃' : '⌄'}</Text>
      </Pressable>

      {open && (
        <View style={[styles.body, { borderTopColor: 'rgba(255,255,255,0.15)' }]}>
          <Text style={[styles.label, { color: 'rgba(255,255,255,0.8)' }]}>HOW ARE YOU FEELING?</Text>
          <View style={styles.moods}>
            {MOODS.map((m) => (
              <Pressable
                key={m}
                style={[
                  styles.mood,
                  { backgroundColor: colors.bg, borderColor: 'transparent' },
                  mood === m && { backgroundColor: colors.accentSoft, borderColor: colors.accent },
                ]}
                onPress={() => setMood(mood === m ? null : m)}
              >
                <Text style={{ fontSize: 20 }}>{m}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: 'rgba(255,255,255,0.8)' }]}>WRITE IT DOWN</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bg, color: colors.ink }]}
            placeholder="What's on your mind today?"
            placeholderTextColor={colors.muted}
            multiline
            value={text}
            onChangeText={setText}
          />

          {isPaid ? (
            <View style={{ marginTop: 14 }}>
              <Text style={[styles.label, { color: 'rgba(255,255,255,0.8)' }]}>VOICE NOTE</Text>
              {voiceNote ? (
                <View style={[styles.voiceChip, { backgroundColor: colors.bg, borderColor: colors.accent }]}>
                  <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '600' }}>🎙 Voice note attached</Text>
                  <Pressable onPress={() => { journalApi.destroyVoice(voiceNote.key); setVoiceNote(null); }} hitSlop={8}>
                    <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600' }}>Remove</Text>
                  </Pressable>
                </View>
              ) : voiceBusy ? (
                <View style={[styles.voiceChip, { backgroundColor: colors.bg, borderColor: colors.line }]}>
                  <ActivityIndicator color={colors.accent} />
                  <Text style={{ color: colors.muted, fontSize: 13 }}>Saving voice…</Text>
                </View>
              ) : (
                <VoiceRecorder
                  onSave={async (uri) => {
                    setVoiceBusy(true);
                    try {
                      let uploaded = await journalApi.uploadVoiceNote(uri);
                      setVoiceNote({ key: uploaded.key, durationMillis: 0 });
                    } catch (err) {
                      Alert.alert('Voice upload failed', String(err?.message || err));
                    } finally {
                      setVoiceBusy(false);
                    }
                  }}
                  onDiscard={() => {}}
                />
              )}
            </View>
          ) : null}

          <Pressable
            style={[
              styles.save,
              { backgroundColor: colors.accent, opacity: saving || (!mood && !text.trim() && !voiceNote) ? 0.5 : 1 },
            ]}
            onPress={handleSave}
            disabled={saving || (!mood && !text.trim() && !voiceNote)}
          >
            <Text style={[styles.saveText, { color: colors.surface }]}>
              {saving ? 'Saving…' : 'Save entry'}
            </Text>
          </Pressable>
        </View>
      )}
    </BlurView>
  );
}

let styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 16, marginTop: 10, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
  headText: { fontSize: 13, fontWeight: '600' },
  chev: { fontSize: 15 },
  body: { borderTopWidth: 1, padding: 15, gap: 0 },
  label: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1.3, marginBottom: 10 },
  moods: { flexDirection: 'row', gap: 7, marginBottom: 16 },
  mood: { flex: 1, aspectRatio: 1, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  input: { borderRadius: 12, padding: 13, fontSize: 13.5, minHeight: 80, textAlignVertical: 'top' },
  save: { borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 12 },
  saveText: { fontSize: 13, fontWeight: '700' },
  voiceChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, padding: 14 },
});