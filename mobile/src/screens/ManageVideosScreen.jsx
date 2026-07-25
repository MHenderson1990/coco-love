import { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable,
  Modal, TextInput, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import MonthFilter from '../components/MonthFilter';
import * as videosApi from '../api/videos';

export default function ManageVideosScreen({ navigation }) {
  let { colors } = useTheme();
  let [items, setItems] = useState([]);
  let [loading, setLoading] = useState(true);
  let [editing, setEditing] = useState(null);
  let [month, setMonth] = useState(null);

  let load = useCallback(() => {
    let active = true;
    videosApi.listVideos()
      .then((data) => { if (active) setItems(data); })
      .catch(() => { if (active) setItems([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useFocusEffect(load);

  let filtered = month
    ? items.filter((v) => {
        let d = new Date(v.createdAt);
        return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
      })
    : items;

  function confirmDelete(video) {
    Alert.alert(
      'Delete this video?',
      'It will be removed from the library. This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await videosApi.deleteVideo(video._id);
              setItems((prev) => prev.filter((v) => v._id !== video._id));
            } catch (err) {
              Alert.alert('Could not delete', 'Try again in a moment.');
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: 'transparent' }]} edges={['top']}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={[styles.back, { color: colors.muted }]}>‹ Back</Text>
      </Pressable>

      <Text style={[styles.title, { color: colors.ink }]}>Manage videos</Text>
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
              {month ? 'No videos this month.' : 'No videos yet.'}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.line }]}
              onPress={() => setEditing(item)}
              onLongPress={() => confirmDelete(item)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.ink }]}>{item.title}</Text>
                <Text style={[styles.rowMeta, { color: colors.muted }]}>
                  {item.tier === 'free' ? 'Free' : 'Members'}
                  {item.description ? ` · ${item.description}` : ''}
                </Text>
              </View>
              <Text style={[styles.edit, { color: colors.accent }]}>Edit</Text>
            </Pressable>
          )}
        />
      )}

      <EditVideoModal
        video={editing}
        colors={colors}
        onClose={() => setEditing(null)}
        onSaved={(updated) => {
          setItems((prev) => prev.map((v) => (v._id === updated._id ? updated : v)));
          setEditing(null);
        }}
        onDelete={(video) => {
          setEditing(null);
          setTimeout(() => confirmDelete(video), 300);
        }}
      />
    </SafeAreaView>
  );
}

function EditVideoModal({ video, colors, onClose, onSaved, onDelete }) {
  let [title, setTitle] = useState('');
  let [description, setDescription] = useState('');
  let [tier, setTier] = useState('paid');
  let [busy, setBusy] = useState(false);
  let [ready, setReady] = useState(false);

  if (video && !ready) {
    setTitle(video.title || '');
    setDescription(video.description || '');
    setTier(video.tier || 'paid');
    setReady(true);
  }
  if (!video && ready) setReady(false);

  async function save() {
    if (!title.trim()) {
      Alert.alert('Title required', 'Give it a title.');
      return;
    }
    setBusy(true);
    try {
      let updated = await videosApi.updateVideo(video._id, {
        title: title.trim(),
        description: description.trim(),
        tier,
      });
      onSaved(updated);
    } catch (err) {
      Alert.alert('Could not save', 'Try again in a moment.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={!!video} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.sheetWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.sheetHead}>
            <Text style={[styles.sheetTitle, { color: colors.ink }]}>Edit video</Text>
            <Pressable onPress={onClose}>
              <Text style={{ color: colors.muted, fontSize: 20 }}>✕</Text>
            </Pressable>
          </View>

          <TextInput
            style={[styles.input, { backgroundColor: colors.bg, color: colors.ink }]}
            placeholder="Title"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.bg, color: colors.ink }]}
            placeholder="Short description"
            placeholderTextColor={colors.muted}
            value={description}
            onChangeText={setDescription}
          />

          <View style={[styles.tierToggle, { borderColor: colors.line }]}>
            {['free', 'paid'].map((t) => (
              <Pressable
                key={t}
                style={[styles.tierBtn, tier === t && { backgroundColor: colors.accent }]}
                onPress={() => setTier(t)}
              >
                <Text style={{ color: tier === t ? colors.surface : colors.muted, fontSize: 12, fontWeight: '700' }}>
                  {t === 'free' ? 'Free for everyone' : 'Members only'}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.btn, { backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 }]}
            onPress={save}
            disabled={busy}
          >
            <Text style={[styles.btnText, { color: colors.surface }]}>
              {busy ? 'Saving…' : 'Save changes'}
            </Text>
          </Pressable>

          <Pressable style={styles.deleteBtn} onPress={() => onDelete(video)}>
            <Text style={[styles.deleteText, { color: colors.muted }]}>Delete this video</Text>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 15, padding: 15 },
  rowTitle: { fontSize: 14.5, fontWeight: '600' },
  rowMeta: { fontSize: 12, marginTop: 4 },
  edit: { fontSize: 13, fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },

  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 34 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  sheetTitle: { fontSize: 18, fontWeight: '600' },
  input: { borderRadius: 12, padding: 14, fontSize: 14, marginBottom: 12 },
  tierToggle: { flexDirection: 'row', borderWidth: 1, borderRadius: 100, overflow: 'hidden', marginBottom: 14 },
  tierBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  btn: { borderRadius: 13, paddingVertical: 14, alignItems: 'center' },
  btnText: { fontSize: 13, fontWeight: '700' },
  deleteBtn: { alignItems: 'center', paddingVertical: 14 },
  deleteText: { fontSize: 13, fontWeight: '600' },
});