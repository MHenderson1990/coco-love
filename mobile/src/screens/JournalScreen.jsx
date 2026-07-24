import { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable,
  Modal, TextInput, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import * as journalApi from '../api/journal';

let MOODS = ['🌤', '😌', '😐', '😔', '🔥'];

export default function JournalScreen({ navigation }) {
  let { colors } = useTheme();
  let [items, setItems] = useState([]);
  let [loading, setLoading] = useState(true);
  let [editing, setEditing] = useState(null);

  let load = useCallback(() => {
    let active = true;
    journalApi.listEntries()
      .then((data) => { if (active) setItems(data); })
      .catch(() => { if (active) setItems([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useFocusEffect(load);

  function confirmDelete(entry) {
    Alert.alert(
      'Delete this entry?',
      'This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await journalApi.deleteEntry(entry._id);
              setItems((prev) => prev.filter((e) => e._id !== entry._id));
            } catch (err) {
              Alert.alert('Could not delete', 'Try again in a moment.');
            }
          },
        },
      ]
    );
  }

  function formatDate(value) {
    let date = new Date(value);
    let today = new Date().setHours(0, 0, 0, 0);
    let day = new Date(value).setHours(0, 0, 0, 0);
    let diff = Math.round((today - day) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: colors.bg }]} edges={['top']}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={[styles.back, { color: colors.muted }]}>‹ Back</Text>
      </Pressable>

      <Text style={[styles.title, { color: colors.ink }]}>Your journal</Text>
      <Text style={[styles.sub, { color: colors.muted }]}>Tap an entry to edit it.</Text>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.muted }]}>
              Open today's message and tap "Add to your journal" to start.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.line }]}
              onPress={() => setEditing(item)}
              onLongPress={() => confirmDelete(item)}
            >
              <View style={styles.head}>
                <Text style={[styles.date, { color: colors.accent }]}>
                  {formatDate(item.createdAt).toUpperCase()}
                </Text>
                {item.mood ? <Text style={styles.mood}>{item.mood}</Text> : null}
              </View>

              {item.text ? (
                <Text style={[styles.text, { color: colors.ink }]}>{item.text}</Text>
              ) : null}

              {item.affirmation?.text ? (
                <View style={[styles.quote, { borderLeftColor: colors.accentSoft }]}>
                  <Text style={[styles.quoteText, { color: colors.muted }]} numberOfLines={2}>
                    {item.affirmation.text}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          )}
        />
      )}

      <EditModal
        entry={editing}
        colors={colors}
        onClose={() => setEditing(null)}
        onSaved={(updated) => {
          setItems((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
          setEditing(null);
        }}
        onDelete={(entry) => {
          setEditing(null);
          setTimeout(() => confirmDelete(entry), 300);
        }}
      />
    </SafeAreaView>
  );
}

function EditModal({ entry, colors, onClose, onSaved, onDelete }) {
  let [mood, setMood] = useState(null);
  let [text, setText] = useState('');
  let [busy, setBusy] = useState(false);
  let [ready, setReady] = useState(false);

  // seed the fields the first render after an entry is passed in
  if (entry && !ready) {
    setMood(entry.mood || null);
    setText(entry.text || '');
    setReady(true);
  }
  if (!entry && ready) setReady(false);

  async function save() {
    if (!mood && !text.trim()) {
      Alert.alert('Nothing to save', 'Add a mood or write something.');
      return;
    }
    setBusy(true);
    try {
      let updated = await journalApi.updateEntry(entry._id, mood, text.trim());
      onSaved(updated);
    } catch (err) {
      Alert.alert('Could not save', 'Try again in a moment.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={!!entry} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.sheetWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.sheetHead}>
            <Text style={[styles.sheetTitle, { color: colors.ink }]}>Edit entry</Text>
            <Pressable onPress={onClose}>
              <Text style={{ color: colors.muted, fontSize: 20 }}>✕</Text>
            </Pressable>
          </View>

          <Text style={[styles.label, { color: colors.muted }]}>HOW WERE YOU FEELING?</Text>
          <View style={styles.moods}>
            {MOODS.map((m) => (
              <Pressable
                key={m}
                style={[
                  styles.moodBtn,
                  { backgroundColor: colors.bg, borderColor: 'transparent' },
                  mood === m && { backgroundColor: colors.accentSoft, borderColor: colors.accent },
                ]}
                onPress={() => setMood(mood === m ? null : m)}
              >
                <Text style={{ fontSize: 20 }}>{m}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.muted }]}>WHAT YOU WROTE</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bg, color: colors.ink }]}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.muted}
            multiline
            value={text}
            onChangeText={setText}
          />

          <Pressable
            style={[styles.btn, { backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 }]}
            onPress={save}
            disabled={busy}
          >
            <Text style={[styles.btnText, { color: colors.surface }]}>
              {busy ? 'Saving…' : 'Save changes'}
            </Text>
          </Pressable>

          <Pressable style={styles.deleteBtn} onPress={() => onDelete(entry)}>
            <Text style={[styles.deleteText, { color: colors.muted }]}>Delete this entry</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

let styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 22 },
  back: { fontSize: 15, marginTop: 12, marginBottom: 6 },
  title: { fontSize: 24, fontWeight: '500', letterSpacing: -0.4 },
  sub: { fontSize: 13.5, marginTop: 5, marginBottom: 16 },
  list: { gap: 9, paddingBottom: 24 },
  row: { borderWidth: 1, borderRadius: 15, padding: 15 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  date: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  mood: { fontSize: 18 },
  text: { fontSize: 14.5, lineHeight: 21 },
  quote: { borderLeftWidth: 3, paddingLeft: 11, marginTop: 12 },
  quoteText: { fontSize: 12.5, lineHeight: 18, fontStyle: 'italic' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14, lineHeight: 21 },

  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 34 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  sheetTitle: { fontSize: 18, fontWeight: '600' },
  label: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1.3, marginBottom: 10 },
  moods: { flexDirection: 'row', gap: 7, marginBottom: 18 },
  moodBtn: { flex: 1, aspectRatio: 1, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  input: { borderRadius: 12, padding: 13, fontSize: 14, minHeight: 90, textAlignVertical: 'top', marginBottom: 16 },
  btn: { borderRadius: 13, paddingVertical: 14, alignItems: 'center' },
  btnText: { fontSize: 13, fontWeight: '700' },
  deleteBtn: { alignItems: 'center', paddingVertical: 14 },
  deleteText: { fontSize: 13, fontWeight: '600' },
});