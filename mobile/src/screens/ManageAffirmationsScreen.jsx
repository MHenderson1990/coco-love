import { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable,
  Modal, TextInput, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import MonthFilter from '../components/MonthFilter';
import * as adminApi from '../api/admin';

export default function ManageAffirmationsScreen({ navigation }) {
  let { colors } = useTheme();
  let [items, setItems] = useState([]);
  let [loading, setLoading] = useState(true);
  let [editing, setEditing] = useState(null);
  let [month, setMonth] = useState(null);

  let load = useCallback(() => {
    let active = true;
    adminApi.listAllAffirmations()
      .then((data) => { if (active) setItems(data); })
      .catch(() => { if (active) setItems([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useFocusEffect(load);

  let filtered = month
    ? items.filter((a) => {
        let d = new Date(a.scheduledDate);
        return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
      })
    : items;

  function confirmDelete(a) {
    Alert.alert(
      'Delete this message?',
      'This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminApi.deleteAffirmation(a._id);
              setItems((prev) => prev.filter((x) => x._id !== a._id));
            } catch (err) {
              Alert.alert('Could not delete', 'Try again in a moment.');
            }
          },
        },
      ]
    );
  }

  function label(dateStr) {
    let d = new Date(dateStr);
    let today = new Date().setHours(0, 0, 0, 0);
    let day = new Date(dateStr).setHours(0, 0, 0, 0);
    let diff = Math.round((day - today) / 86400000);
    let base = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (diff === 0) return `${base} · Today`;
    if (diff > 0) return `${base} · in ${diff}d`;
    return base;
  }

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: colors.bg }]} edges={['top']}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={[styles.back, { color: colors.muted }]}>‹ Back</Text>
      </Pressable>

      <Text style={[styles.title, { color: colors.ink }]}>Manage messages</Text>
      <Text style={[styles.sub, { color: colors.muted }]}>Tap to edit, long-press to delete.</Text>

      <MonthFilter value={month} onChange={setMonth} />

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.muted }]}>
              {month ? 'No messages this month.' : 'No messages yet.'}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.line }]}
              onPress={() => setEditing(item)}
              onLongPress={() => confirmDelete(item)}
            >
              <Text style={[styles.date, { color: colors.accent }]}>{label(item.scheduledDate).toUpperCase()}</Text>
              <Text style={[styles.text, { color: colors.ink }]}>{item.text}</Text>
            </Pressable>
          )}
        />
      )}

      <EditAffirmationModal
        affirmation={editing}
        colors={colors}
        onClose={() => setEditing(null)}
        onSaved={(updated) => {
          setItems((prev) =>
            prev
              .map((a) => (a._id === updated._id ? updated : a))
              .sort((x, y) => new Date(y.scheduledDate) - new Date(x.scheduledDate))
          );
          setEditing(null);
        }}
        onDelete={(a) => {
          setEditing(null);
          setTimeout(() => confirmDelete(a), 300);
        }}
      />
    </SafeAreaView>
  );
}

function EditAffirmationModal({ affirmation, colors, onClose, onSaved, onDelete }) {
  let [text, setText] = useState('');
  let [date, setDate] = useState(new Date());
  let [showPicker, setShowPicker] = useState(false);
  let [busy, setBusy] = useState(false);
  let [ready, setReady] = useState(false);

  if (affirmation && !ready) {
    setText(affirmation.text || '');
    setDate(new Date(affirmation.scheduledDate));
    setReady(true);
  }
  if (!affirmation && ready) setReady(false);

  async function save() {
    if (!text.trim()) {
      Alert.alert('Message required', 'Write something.');
      return;
    }
    setBusy(true);
    try {
      let updated = await adminApi.updateAffirmation(affirmation._id, text.trim(), date.toISOString());
      onSaved(updated);
    } catch (err) {
      Alert.alert(
        'Could not save',
        err.response?.data?.error || 'Try again in a moment.'
      );
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
            <Text style={[styles.sheetTitle, { color: colors.ink }]}>Edit message</Text>
            <Pressable onPress={onClose}>
              <Text style={{ color: colors.muted, fontSize: 20 }}>✕</Text>
            </Pressable>
          </View>

          <TextInput
            style={[styles.input, styles.textarea, { backgroundColor: colors.bg, color: colors.ink }]}
            placeholder="The message"
            placeholderTextColor={colors.muted}
            multiline
            value={text}
            onChangeText={setText}
          />

          <Pressable
            style={[styles.input, { backgroundColor: colors.bg, justifyContent: 'center' }]}
            onPress={() => setShowPicker(true)}
          >
            <Text style={{ color: colors.ink, fontSize: 14 }}>
              {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          </Pressable>

          {showPicker && (
            <View style={{ backgroundColor: colors.bg, borderRadius: 12, marginBottom: 12 }}>
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e, selected) => {
                  if (Platform.OS === 'android') setShowPicker(false);
                  if (selected) setDate(selected);
                }}
              />
              {Platform.OS === 'ios' && (
                <Pressable style={{ alignItems: 'center', paddingVertical: 10 }} onPress={() => setShowPicker(false)}>
                  <Text style={{ color: colors.accent, fontWeight: '700' }}>Done</Text>
                </Pressable>
              )}
            </View>
          )}

          <Pressable
            style={[styles.btn, { backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 }]}
            onPress={save}
            disabled={busy}
          >
            <Text style={[styles.btnText, { color: colors.surface }]}>
              {busy ? 'Saving…' : 'Save changes'}
            </Text>
          </Pressable>

          <Pressable style={styles.deleteBtn} onPress={() => onDelete(affirmation)}>
            <Text style={[styles.deleteText, { color: colors.muted }]}>Delete this message</Text>
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
  text: { fontSize: 14.5, lineHeight: 21 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },

  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 34 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  sheetTitle: { fontSize: 18, fontWeight: '600' },
  input: { borderRadius: 12, padding: 14, fontSize: 14, marginBottom: 12 },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  btn: { borderRadius: 13, paddingVertical: 14, alignItems: 'center' },
  btnText: { fontSize: 13, fontWeight: '700' },
  deleteBtn: { alignItems: 'center', paddingVertical: 14 },
  deleteText: { fontSize: 13, fontWeight: '600' },
});