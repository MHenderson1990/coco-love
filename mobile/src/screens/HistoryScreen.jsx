import { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable,
  Modal, TextInput, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import * as affirmationsApi from '../api/affirmations';
import * as favoritesApi from '../api/favorites';
import * as journalApi from '../api/journal';
import MonthFilter from '../components/MonthFilter';
import RichText from '../components/RichText';

let MOODS = ['🌤', '😌', '😐', '😔', '🔥'];

export default function HistoryScreen({ navigation }) {
  let { colors } = useTheme();
  let [items, setItems] = useState([]);
  let [loading, setLoading] = useState(true);
  let [month, setMonth] = useState(null);
  let [active, setActive] = useState(null); // the tapped message

  let load = useCallback(() => {
    let alive = true;
    affirmationsApi.getHistory()
      .then((data) => { if (alive) setItems(data); })
      .catch(() => { if (alive) setItems([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  useFocusEffect(load);

  function formatDate(value) {
    let date = new Date(value);
    let dateOnly = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

    let now = new Date();
    let todayOnly = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    let diff = Math.round((todayOnly - dateOnly) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
  }

  let shown = month
    ? items.filter((e) => {
        let d = new Date(e.scheduledDate);
        return d.getUTCFullYear() === month.getFullYear() && d.getUTCMonth() === month.getMonth();
      })
    : items;

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: 'transparent' }]} edges={['top']}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={[styles.back, { color: colors.muted }]}>‹ Back</Text>
      </Pressable>

      <Text style={[styles.title, { color: colors.ink }]}>Past messages</Text>
      <Text style={[styles.sub, { color: colors.muted }]}>Tap a message to save it or journal about it.</Text>

      <MonthFilter value={month} onChange={setMonth} />

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.muted }]}>
              {month ? 'No messages this month.' : 'Your first message will appear here tomorrow morning.'}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.line }]}
              onPress={() => setActive(item)}
            >
              <Text style={[styles.date, { color: colors.accent }]}>
                {formatDate(item.scheduledDate).toUpperCase()}
              </Text>
              <RichText style={[styles.text, { color: colors.ink }]} text={item.text} />
            </Pressable>
          )}
        />
      )}

      <MessageSheet
        key={active?._id || 'none'}
        affirmation={active}
        colors={colors}
        onClose={() => setActive(null)}
      />
    </SafeAreaView>
  );
}

function MessageSheet({ affirmation, colors, onClose }) {
  let [saved, setSaved] = useState(false);
  let [saving, setSaving] = useState(false);
  let [mood, setMood] = useState(null);
  let [text, setText] = useState('');
  let [busy, setBusy] = useState(false);

  async function save() {
    if (!affirmation || saved) return;
    setSaving(true);
    try {
      await favoritesApi.addFavorite(affirmation._id);
      setSaved(true);
    } catch (err) {
      if (err.response?.status === 409) setSaved(true);
      else Alert.alert('Could not save', 'Try again in a moment.');
    } finally {
      setSaving(false);
    }
  }

  async function writeEntry() {
    if (!mood && !text.trim()) {
      Alert.alert('Nothing to save', 'Add a mood or write something.');
      return;
    }
    setBusy(true);
    try {
      await journalApi.createEntry(affirmation._id, mood, text.trim());
      Alert.alert('Saved to your journal', 'Find it in the Journal tab.');
      onClose();
    } catch (err) {
      Alert.alert('Could not save', 'Try again in a moment.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={!!affirmation} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.sheetWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.sheetHead}>
            <Text style={[styles.sheetTitle, { color: colors.ink }]}>Message</Text>
            <Pressable onPress={onClose}>
              <Text style={{ color: colors.muted, fontSize: 20 }}>✕</Text>
            </Pressable>
          </View>

          <RichText style={[styles.message, { color: colors.ink }]} text={affirmation?.text} />

          <Pressable
            style={[
              styles.saveBtn,
              { backgroundColor: saved ? colors.accentSoft : colors.bg, borderColor: saved ? colors.accent : colors.line },
            ]}
            onPress={save}
            disabled={saving || saved}
          >
            <Text style={[styles.saveText, { color: saved ? colors.accent : colors.muted }]}>
              {saved ? 'Saved to favorites ✓' : saving ? 'Saving…' : 'Save to favorites'}
            </Text>
          </Pressable>

          <Text style={[styles.label, { color: colors.muted }]}>WRITE ABOUT IT</Text>
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

          <TextInput
            style={[styles.input, { backgroundColor: colors.bg, color: colors.ink }]}
            placeholder="What did this bring up?"
            placeholderTextColor={colors.muted}
            multiline
            value={text}
            onChangeText={setText}
          />

          <Pressable
            style={[styles.btn, { backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 }]}
            onPress={writeEntry}
            disabled={busy}
          >
            <Text style={[styles.btnText, { color: colors.surface }]}>
              {busy ? 'Saving…' : 'Write journal entry'}
            </Text>
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
  date: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 7 },
  text: { fontSize: 15, lineHeight: 21 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14, lineHeight: 21 },

  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 34 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sheetTitle: { fontSize: 18, fontWeight: '600' },
  message: { fontSize: 16, lineHeight: 23, marginBottom: 16 },
  saveBtn: { borderWidth: 1, borderRadius: 13, paddingVertical: 13, alignItems: 'center', marginBottom: 18 },
  saveText: { fontSize: 13, fontWeight: '700' },
  label: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1.3, marginBottom: 10 },
  moods: { flexDirection: 'row', gap: 7, marginBottom: 16 },
  moodBtn: { flex: 1, aspectRatio: 1, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  input: { borderRadius: 12, padding: 13, fontSize: 14, minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  btn: { borderRadius: 13, paddingVertical: 14, alignItems: 'center' },
  btnText: { fontSize: 13, fontWeight: '700' },
});