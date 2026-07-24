import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  ActivityIndicator, Modal, Linking, Platform, KeyboardAvoidingView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { CALENDLY_URL } from '../constants/config';
import * as adminApi from '../api/admin';
import * as announcementsApi from '../api/announcements';

export default function AdminScreen({ navigation }) {
  let { colors } = useTheme();

  let [stats, setStats] = useState(null);
  let [top, setTop] = useState([]);
  let [loading, setLoading] = useState(true);

  let [showAffirmation, setShowAffirmation] = useState(false);
  let [showAnnouncement, setShowAnnouncement] = useState(false);

  let load = useCallback(() => {
    let active = true;
    Promise.all([adminApi.getStats(), adminApi.getTopAffirmations()])
      .then(([s, t]) => {
        if (!active) return;
        setStats(s);
        setTop(t);
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useFocusEffect(load);

  let maxScore = top.length ? Math.max(...top.map((a) => a.score), 1) : 1;

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { color: colors.muted }]}>‹ Back</Text>
        </Pressable>

        <Text style={[styles.title, { color: colors.ink }]}>Your community</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>Only you can see this.</Text>

        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.stats}>
              <Stat label="Members" value={stats?.totalUsers} colors={colors} />
              <Stat label="On a streak" value={stats?.activeStreaks} colors={colors} />
              <Stat label="Messages queued" value={stats?.totalAffirmations} colors={colors} />
              <Stat label="Rewards earned" value={stats?.promoUnlocked} colors={colors} />
            </View>

            <Text style={[styles.label, { color: colors.muted }]}>LANDING BEST</Text>
            {top.length === 0 ? (
              <Text style={[styles.empty, { color: colors.muted }]}>
                No feedback yet — this fills in as people respond.
              </Text>
            ) : (
              top.slice(0, 5).map((a) => (
                <View key={a._id} style={styles.barRow}>
                  <Text style={[styles.barText, { color: colors.ink }]} numberOfLines={2}>
                    {a.text}
                  </Text>
                  <View style={[styles.bar, { backgroundColor: colors.accentSoft }]}>
                    <View
                      style={[
                        styles.barFill,
                        { backgroundColor: colors.accent, width: `${Math.max((a.score / maxScore) * 100, 4)}%` },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barMeta, { color: colors.muted }]}>
                    {a.favoriteCount} saved · {a.moreCount} more · {a.lessCount} less
                  </Text>
                </View>
              ))
            )}

            <View style={styles.buttons}>
              <Pressable
                style={[styles.btn, { backgroundColor: colors.accent }]}
                onPress={() => setShowAffirmation(true)}
              >
                <Text style={[styles.btnText, { color: colors.surface }]}>Write a message</Text>
              </Pressable>

              <Pressable
                style={[styles.btn, styles.ghost, { backgroundColor: colors.surface, borderColor: colors.line }]}
                onPress={() => setShowAnnouncement(true)}
              >
                <Text style={[styles.btnText, { color: colors.ink }]}>Send an announcement</Text>
              </Pressable>

              <Pressable
                style={[styles.btn, styles.ghost, { backgroundColor: colors.surface, borderColor: colors.line }]}
                onPress={() => Linking.openURL(CALENDLY_URL)}
              >
                <Text style={[styles.btnText, { color: colors.ink }]}>Open booking calendar</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      <AffirmationModal
        visible={showAffirmation}
        onClose={() => setShowAffirmation(false)}
        onSaved={load}
        colors={colors}
      />

      <AnnouncementModal
        visible={showAnnouncement}
        onClose={() => setShowAnnouncement(false)}
        colors={colors}
      />
    </SafeAreaView>
  );
}

function Stat({ label, value, colors }) {
  return (
    <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <Text style={[styles.statNum, { color: colors.ink }]}>{value ?? '—'}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

function AffirmationModal({ visible, onClose, onSaved, colors }) {
  let [text, setText] = useState('');
  let [date, setDate] = useState(new Date());
  let [showPicker, setShowPicker] = useState(false);
  let [busy, setBusy] = useState(false);
  let [error, setError] = useState('');

  async function save() {
    if (!text.trim()) {
      setError('Write something first.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await adminApi.createAffirmation(text.trim(), date.toISOString());
      setText('');
      setDate(new Date());
      onSaved?.();
      onClose();
      Alert.alert('Saved', 'Your message is scheduled.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Write a message" colors={colors}>
      <TextInput
        style={[styles.input, styles.textarea, { backgroundColor: colors.bg, color: colors.ink }]}
        placeholder="Your peace is a priority, not a luxury."
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

      {error ? <Text style={[styles.error, { color: colors.accent }]}>{error}</Text> : null}

      <Pressable
        style={[styles.btn, { backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 }]}
        onPress={save}
        disabled={busy}
      >
        <Text style={[styles.btnText, { color: colors.surface }]}>{busy ? 'Saving…' : 'Schedule it'}</Text>
      </Pressable>
    </Sheet>
  );
}

function AnnouncementModal({ visible, onClose, colors }) {
  let [title, setTitle] = useState('');
  let [body, setBody] = useState('');
  let [busy, setBusy] = useState(false);
  let [error, setError] = useState('');

  async function send() {
    if (!title.trim() || !body.trim()) {
      setError('Title and message are both required.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await announcementsApi.createAnnouncement(title.trim(), body.trim());
      setTitle('');
      setBody('');
      onClose();
      Alert.alert('Sent', 'Your announcement is live.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Send an announcement" colors={colors}>
      <TextInput
        style={[styles.input, { backgroundColor: colors.bg, color: colors.ink }]}
        placeholder="Title"
        placeholderTextColor={colors.muted}
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={[styles.input, styles.textarea, { backgroundColor: colors.bg, color: colors.ink }]}
        placeholder="What do you want everyone to know?"
        placeholderTextColor={colors.muted}
        multiline
        value={body}
        onChangeText={setBody}
      />

      {error ? <Text style={[styles.error, { color: colors.accent }]}>{error}</Text> : null}

      <Pressable
        style={[styles.btn, { backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 }]}
        onPress={send}
        disabled={busy}
      >
        <Text style={[styles.btnText, { color: colors.surface }]}>{busy ? 'Sending…' : 'Send it'}</Text>
      </Pressable>
    </Sheet>
  );
}

function Sheet({ visible, onClose, title, colors, children }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.sheetWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.sheetHead}>
            <Text style={[styles.sheetTitle, { color: colors.ink }]}>{title}</Text>
            <Pressable onPress={onClose}>
              <Text style={{ color: colors.muted, fontSize: 20 }}>✕</Text>
            </Pressable>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

let styles = StyleSheet.create({
  wrap: { flex: 1 },
  body: { paddingHorizontal: 22, paddingBottom: 40 },
  back: { fontSize: 15, marginTop: 12, marginBottom: 6 },
  title: { fontSize: 24, fontWeight: '500', letterSpacing: -0.4 },
  sub: { fontSize: 13.5, marginTop: 5, marginBottom: 18 },

  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  stat: { width: '48%', borderWidth: 1, borderRadius: 15, padding: 14 },
  statNum: { fontSize: 26, fontWeight: '400', letterSpacing: -0.6 },
  statLabel: { fontSize: 9.5, fontWeight: '700', letterSpacing: 1, marginTop: 7 },

  label: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1.3, marginBottom: 12 },
  empty: { fontSize: 13.5, lineHeight: 20, marginBottom: 12 },
  barRow: { marginBottom: 16 },
  barText: { fontSize: 13.5, lineHeight: 19, marginBottom: 7 },
  bar: { height: 5, borderRadius: 100, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 100 },
  barMeta: { fontSize: 11, marginTop: 6 },

  buttons: { gap: 8, marginTop: 14 },
  btn: { borderRadius: 13, paddingVertical: 14, alignItems: 'center' },
  ghost: { borderWidth: 1 },
  btnText: { fontSize: 13, fontWeight: '700' },

  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 34 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  sheetTitle: { fontSize: 18, fontWeight: '600' },
  input: { borderRadius: 12, padding: 14, fontSize: 14, marginBottom: 12 },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  error: { fontSize: 13, marginBottom: 10 },
});