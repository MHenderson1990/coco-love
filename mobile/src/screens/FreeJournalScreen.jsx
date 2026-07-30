import { useCallback, useRef, useState } from 'react';
import {
  View, Text, Image, FlatList, StyleSheet, ActivityIndicator, Pressable,
  Modal, TextInput, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import * as journalApi from '../api/journal';
import { Ionicons } from '@expo/vector-icons';
import MonthFilter from '../components/MonthFilter';
import VoiceRecorder from '../components/VoiceRecorder';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import RichText from '../components/RichText';
import VoiceNotePlayer from '../components/VoiceNotePlayer';


let MOODS = ['🌤', '😌', '😐', '😔', '🔥'];
let MEDIA_ATTACHMENTS_ENABLED = false;

export default function JournalScreen() {
  let { colors } = useTheme();
  let { user } = useAuth();
  let isPaid = user?.tier === 'paid';
  let [items, setItems] = useState([]);
  let [loading, setLoading] = useState(true);
  let [sheet, setSheet] = useState(null); // null | 'new' | entryObject
  let [month, setMonth] = useState(null); // null = all time
  

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

  let visible = sheet !== null;
  let mode = sheet === 'new' ? 'create' : 'edit';
  let editingEntry = mode === 'edit' ? sheet : null;

  let shown = month
    ? items.filter((e) => {
        let d = new Date(e.createdAt);
        return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
      })
    : items;

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

              {item.affirmation?.text ? (
                <View style={[styles.quote, { borderLeftColor: colors.accentSoft }]}>
                  <RichText style={[styles.quoteText, { color: colors.muted }]} numberOfLines={2} text={item.affirmation.text} />
                </View>
              ) : null}

              {item.voiceNote?.key ? <VoiceNotePlayer voiceKey={item.voiceNote.key} /> : null}
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
        isPaid={isPaid}
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

function EntryModal({ visible, mode, entry, colors, isPaid, onClose, onCreated, onSaved, onDelete }) {
  let [mood, setMood] = useState(entry?.mood || null);
  let [text, setText] = useState(entry?.text || '');
  let [busy, setBusy] = useState(false);
  let [voiceNote, setVoiceNote] = useState(null); // { key, durationMillis }
  let [voiceBusy, setVoiceBusy] = useState(false);
  let [media, setMedia] = useState([]);
  let [uploading, setUploading] = useState(false);
  let savedRef = useRef(false);

  async function save() {
    if (!mood && !text.trim() && media.length === 0 && !voiceNote) {
      Alert.alert('Nothing to save', 'Add a mood, write something, or record a voice note.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'create') {
        let created = await journalApi.createFreeform(mood, text.trim(), media, voiceNote || undefined);
        savedRef.current = true;
        onCreated(created);
      } else {
        let updated = await journalApi.updateEntry(entry._id, mood, text.trim());
        savedRef.current = true;
        onSaved(updated);
      }

    } catch (err) {
      Alert.alert('Could not save', 'Try again in a moment.');
    } finally {
      setBusy(false);
    }
  }


  async function addMedia() {
    let perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Allow access', 'Enable photo access to attach media.'); return; }

    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 });
    if (result.canceled || !result.assets?.length) return;

    let asset = result.assets[0];
    let isVideo = asset.type === 'video';
    let cap = isVideo ? 100 * 1048576 : 10 * 1048576;
    if (asset.fileSize && asset.fileSize > cap) {
      Alert.alert('Too large', `${isVideo ? 'Videos' : 'Photos'} must be under ${isVideo ? '100MB' : '10MB'}.`);
      return;
    }

    setUploading(true);
    try {
      let uploaded = await journalApi.uploadJournalMedia(asset);
      setMedia((prev) => [...prev, uploaded]);
    } catch (err) {
      Alert.alert('Upload failed', err.message || 'Try again in a moment.');
    } finally {
      setUploading(false);
    }
  }

  function handleClose() {
    if (!savedRef.current) {
      media.forEach((m) => journalApi.destroyMedia(m.publicId, m.type));
    }
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.sheetWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.sheetHead}>
            <Text style={[styles.sheetTitle, { color: colors.ink }]}>
              {mode === 'create' ? 'New entry' : 'Edit entry'}
            </Text>
            <Pressable onPress={handleClose}>
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

        {isPaid ? (
            <>
              <Text style={[styles.label, { color: colors.muted }]}>VOICE NOTE</Text>
              {voiceNote ? (
                <View style={[styles.voiceChip, { backgroundColor: colors.bg, borderColor: colors.accent }]}>
                  <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '600' }}>🎙 Voice note attached</Text>
                  <Pressable onPress={() => setVoiceNote(null)} hitSlop={8}>
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
                      let saved = await journalApi.uploadVoiceNote(uri);
                      setVoiceNote({ key: saved.key, durationMillis: 0 });
                    } catch (err) {
                      Alert.alert('Voice upload failed', String(err?.message || err));
                    } finally {
                      setVoiceBusy(false);
                    }
                  }}
                  onDiscard={() => {}}
                />
              )}

              {MEDIA_ATTACHMENTS_ENABLED ? <Text style={[styles.label, { color: colors.muted }]}>PHOTOS & VIDEO</Text> : null}
              <View style={styles.mediaRow}>
                {media.map((m, i) => (
                  <View key={i} style={styles.thumbWrap}>
                    {m.type === 'video' ? (
                      <View style={[styles.thumb, styles.thumbCenter, { backgroundColor: colors.bg }]}>
                        <Ionicons name="videocam" size={20} color={colors.accent} />
                      </View>
                    ) : (
                      <Image source={{ uri: m.url }} style={styles.thumb} />
                    )}
                    <Pressable style={styles.thumbX} onPress={() => { journalApi.destroyMedia(m.publicId, m.type); setMedia((prev) => prev.filter((_, j) => j !== i)); }}>
                      <Text style={styles.thumbXText}>✕</Text>
                    </Pressable>
                  </View>
                ))}
                {MEDIA_ATTACHMENTS_ENABLED ? (
                  <Pressable style={[styles.addMedia, { borderColor: colors.line }]} onPress={addMedia} disabled={uploading}>
                    {uploading ? <ActivityIndicator color={colors.accent} /> : <Ionicons name="add" size={24} color={colors.muted} />}
                  </Pressable>
                ) : null}
              </View>
            </>
          ) : null}

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
  quote: { borderLeftWidth: 3, paddingLeft: 11, marginTop: 12 },
  quoteText: { fontSize: 12.5, lineHeight: 18, fontStyle: 'italic' },
  voiceChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16 },
  mediaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  thumbWrap: { position: 'relative' },
  thumb: { width: 60, height: 60, borderRadius: 10 },
  thumbCenter: { alignItems: 'center', justifyContent: 'center' },
  thumbX: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  thumbXText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  addMedia: { width: 60, height: 60, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
});