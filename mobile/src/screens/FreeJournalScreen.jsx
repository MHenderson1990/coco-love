import { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable,
  Modal, TextInput, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import * as journalApi from '../api/journal';
import { Ionicons } from '@expo/vector-icons';

let MOODS = ['🌤', '😌', '😐', '😔', '🔥'];

export default function JournalScreen() {
  let { colors } = useTheme();
  let [items, setItems] = useState([]);
  let [loading, setLoading] = useState(true);
  let [sheet, setSheet] = useState(null); // null | 'new' | entryObject

  let load = useCallback(() => {
    let active = true;
    journalApi.listEntries('freeform')
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

  let visible = sheet !== null;
  let mode = sheet === 'new' ? 'create' : 'edit';
  let editingEntry = mode === 'edit' ? sheet : null;

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: 'transparent' }]} edges={['top']}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.ink }]}>Your journal</Text>
          <Text style={[styles.sub, { color: colors.muted }]}>A space just for you.</Text>
        </View>
        <Pressable
          style={[styles.newBtn, { backgroundColor: colors.accent }]}
          onPress={() => setSheet('new')}
        >
          <Text style={[styles.newBtnText, { color: colors.surface }]}>+ New</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.muted }]}>
              Tap + New to write your first entry.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.line }]}
              onPress={() => setSheet(item)}
              onLongPress={() => confirmDelete(item)}
            >
              <View style={styles.head}>
              <Text style={[styles.date, { color: colors.accent }]}>
                  {formatDate(item.createdAt).toUpperCase()}
              </Text>
            <View style={styles.actions}>
                {item.mood ? <Text style={styles.mood}>{item.mood}</Text> : null}
            <Pressable hitSlop={8} style={styles.iconBtn} onPress={() => setSheet(item)}>
            <Ionicons name="pencil" size={16} color={colors.muted} />
          </Pressable>
          <Pressable hitSlop={8} style={styles.iconBtn} onPress={() => confirmDelete(item)}>
            <Ionicons name="trash-outline" size={16} color={colors.muted} />
          </Pressable>
        </View>
      </View>

              {item.text ? (
                <Text style={[styles.text, { color: colors.ink }]}>{item.text}</Text>
              ) : null}
            </Pressable>
          )}
        />
      )}

      <EntryModal
        key={sheet === 'new' ? 'new' : editingEntry?._id || 'none'}
        visible={visible}
        mode={mode}
        entry={editingEntry}
        colors={colors}
        onClose={() => setSheet(null)}
        onCreated={(entry) => { setItems((prev) => [entry, ...prev]); setSheet(null); }}
        onSaved={(updated) => {
          setItems((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
          setSheet(null);
        }}
        onDelete={(entry) => {
          setSheet(null);
          setTimeout(() => confirmDelete(entry), 300);
        }}
      />
    </SafeAreaView>
  );
}

function EntryModal({ visible, mode, entry, colors, onClose, onCreated, onSaved, onDelete }) {
  let [mood, setMood] = useState(entry?.mood || null);
  let [text, setText] = useState(entry?.text || '');
  let [busy, setBusy] = useState(false);

  async function save() {
    if (!mood && !text.trim()) {
      Alert.alert('Nothing to save', 'Add a mood or write something.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'create') {
        let created = await journalApi.createFreeform(mood, text.trim());
        onCreated(created);
      } else {
        let updated = await journalApi.updateEntry(entry._id, mood, text.trim());
        onSaved(updated);
      }
    } catch (err) {
      Alert.alert('Could not save', 'Try again in a moment.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.sheetWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.sheetHead}>
            <Text style={[styles.sheetTitle, { color: colors.ink }]}>
              {mode === 'create' ? 'New entry' : 'Edit entry'}
            </Text>
            <Pressable onPress={onClose}>
              <Text style={{ color: colors.muted, fontSize: 20 }}>✕</Text>
            </Pressable>
          </View>

          <Text style={[styles.label, { color: colors.muted }]}>HOW ARE YOU FEELING?</Text>
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

          <Text style={[styles.label, { color: colors.muted }]}>WRITE IT OUT</Text>
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
              {busy ? 'Saving…' : mode === 'create' ? 'Save entry' : 'Save changes'}
            </Text>
          </Pressable>

          {mode === 'edit' ? (
            <Pressable style={styles.deleteBtn} onPress={() => onDelete(entry)}>
              <Text style={[styles.deleteText, { color: colors.muted }]}>Delete this entry</Text>
            </Pressable>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

let styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 22 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '500', letterSpacing: -0.4 },
  sub: { fontSize: 13.5, marginTop: 5 },
  newBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, marginTop: 4 },
  newBtnText: { fontSize: 13, fontWeight: '700' },
  list: { gap: 9, paddingBottom: 24 },
  row: { borderWidth: 1, borderRadius: 15, padding: 15 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  date: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  mood: { fontSize: 18 },
  text: { fontSize: 14.5, lineHeight: 21 },
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
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBtn: { padding: 2 },
});