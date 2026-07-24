import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import * as journalApi from '../api/journal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

let MOODS = ['🌤', '😌', '😐', '😔', '🔥'];

export default function JournalDrawer({ affirmationId, onOpenChange }) {
  let { colors } = useTheme();
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
    if (!mood && !text.trim()) return;
    setSaving(true);
    try {
      await journalApi.createEntry(affirmationId, mood, text.trim());
      setSaved(true);
      setText('');
      setMood(null);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      // non-blocking
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <Pressable style={styles.head} onPress={toggle}>
        <Text style={[styles.headText, { color: colors.ink }]}>
          {saved ? 'Entry saved' : 'Add to your journal'}
        </Text>
        <Text style={[styles.chev, { color: colors.muted }]}>{open ? '⌃' : '⌄'}</Text>
      </Pressable>

      {open && (
        <View style={[styles.body, { borderTopColor: colors.line }]}>
          <Text style={[styles.label, { color: colors.muted }]}>HOW ARE YOU FEELING?</Text>
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

          <Text style={[styles.label, { color: colors.muted }]}>WRITE IT DOWN</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bg, color: colors.ink }]}
            placeholder="What's on your mind today?"
            placeholderTextColor={colors.muted}
            multiline
            value={text}
            onChangeText={setText}
          />

          <Pressable
            style={[
              styles.save,
              { backgroundColor: colors.accent, opacity: saving || (!mood && !text.trim()) ? 0.5 : 1 },
            ]}
            onPress={handleSave}
            disabled={saving || (!mood && !text.trim())}
          >
            <Text style={[styles.saveText, { color: colors.surface }]}>
              {saving ? 'Saving…' : 'Save entry'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

let styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 16, marginTop: 10, overflow: 'hidden' },
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
});