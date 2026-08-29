import { useCallback, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  ActivityIndicator, Modal, Linking, Platform, KeyboardAvoidingView, Alert,
  Switch, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { CALENDLY_URL } from '../constants/config';
import * as adminApi from '../api/admin';
import * as announcementsApi from '../api/announcements';
import * as ImagePicker from 'expo-image-picker';
import * as videosApi from '../api/videos';
import RichText from '../components/RichText';

export default function AdminScreen({ navigation }) {
  let { colors } = useTheme();

  let [stats, setStats] = useState(null);
  let [top, setTop] = useState([]);
  let [loading, setLoading] = useState(true);

  let [showAffirmation, setShowAffirmation] = useState(false);
  let [showAnnouncement, setShowAnnouncement] = useState(false);
  let [showVideo, setShowVideo] = useState(false);
  let [showPromo, setShowPromo] = useState(false);

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
    <SafeAreaView style={[styles.wrap, { backgroundColor: 'transparent' }]} edges={['top']}>
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
              <Stat label="Members paid" value={stats?.paidMembers} colors={colors} />
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
                onPress={() => navigation.navigate('Engagement')}
              >
                <Text style={[styles.btnText, { color: colors.ink }]}>Who's loving what</Text>
              </Pressable>

              <Pressable
                style={[styles.btn, styles.ghost, { backgroundColor: colors.surface, borderColor: colors.line }]}
                onPress={() => setShowAnnouncement(true)}
              >
                <Text style={[styles.btnText, { color: colors.ink }]}>Send an announcement</Text>
              </Pressable>

            <Pressable
                style={[styles.btn, styles.ghost, { backgroundColor: colors.surface, borderColor: colors.line }]}
                onPress={() => setShowVideo(true)}
              >
                <Text style={[styles.btnText, { color: colors.ink }]}>Upload a video</Text>
              </Pressable>

              <Pressable
                style={[styles.btn, styles.ghost, { backgroundColor: colors.surface, borderColor: colors.line }]}
                onPress={() => Linking.openURL(CALENDLY_URL)}
              >
                <Text style={[styles.btnText, { color: colors.ink }]}>Open booking calendar</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.ghost, { backgroundColor: colors.surface, borderColor: colors.line }]}
                onPress={() => navigation.navigate('ManageAffirmations')}
              >
                <Text style={[styles.btnText, { color: colors.ink }]}>Manage messages</Text>
              </Pressable>

              <Pressable
                style={[styles.btn, styles.ghost, { backgroundColor: colors.surface, borderColor: colors.line }]}
                onPress={() => navigation.navigate('ManageVideos')}
              >
                <Text style={[styles.btnText, { color: colors.ink }]}>Manage videos</Text>
              </Pressable>

              <Pressable
                style={[styles.btn, styles.ghost, { backgroundColor: colors.surface, borderColor: colors.line }]}
                onPress={() => setShowPromo(true)}
              >
                <Text style={[styles.btnText, { color: colors.ink }]}>Set reward code</Text>
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

      <VideoModal
        visible={showVideo}
        onClose={() => setShowVideo(false)}
        colors={colors}
      />

      <PromoModal
        visible={showPromo}
        onClose={() => setShowPromo(false)}
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
  let { mode } = useTheme();
  let [text, setText] = useState('');
  let [date, setDate] = useState(new Date());
  let [showPicker, setShowPicker] = useState(false);
  let [busy, setBusy] = useState(false);
  let [error, setError] = useState('');
  let [selection, setSelection] = useState({ start: 0, end: 0 });
  let [personalize, setPersonalize] = useState(false);
  let [userQuery, setUserQuery] = useState('');
  let [userResults, setUserResults] = useState([]);
  let [selectedUser, setSelectedUser] = useState(null);
  let [likedAffirmations, setLikedAffirmations] = useState([]);
  let [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!personalize || !userQuery.trim()) {
      setUserResults([]);
      return;
    }
    let handle = setTimeout(async () => {
      setSearching(true);
      try {
        let results = await adminApi.searchUsers(userQuery.trim());
        setUserResults(results);
      } catch (err) {
        setUserResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [userQuery, personalize]);

  async function selectUser(user) {
    setSelectedUser(user);
    setUserResults([]);
    setUserQuery('');
    try {
      let liked = await adminApi.getUserFavorites(user._id);
      setLikedAffirmations(liked);
    } catch (err) {
      setLikedAffirmations([]);
    }
  }

  function wrap(marker) {
    let { start, end } = selection;
    if (start === end) return; // nothing selected — select text first
    let next = text.slice(0, start) + marker + text.slice(start, end) + marker + text.slice(end);
    setText(next);
  }

  async function save() {
    if (!text.trim()) {
      setError('Write something first.');
      return;
    }

    setError('');
    setBusy(true);

    try {
      let year = date.getFullYear();
      let month = String(date.getMonth() + 1).padStart(2, '0');
      let day = String(date.getDate()).padStart(2, '0');

      let dateOnly = `${year}-${month}-${day}`;

      console.log('PICKED DATE OBJECT:', date);
      console.log('DATE ONLY BEING SENT:', dateOnly);

      if (personalize && !selectedUser) {
        setError('Pick a user to personalize for, or turn personalize off.');
        setBusy(false);
        return;
      }

      let savedForName = personalize ? selectedUser.name : null;

      await adminApi.createAffirmation(text.trim(), dateOnly, undefined, personalize ? selectedUser._id : null);
      setText('');
      setDate(new Date());
      setPersonalize(false);
      setSelectedUser(null);
      setLikedAffirmations([]);
      onSaved?.();
      onClose();
      Alert.alert('Saved', savedForName ? `Personalized message scheduled for ${savedForName}.` : 'Your message is scheduled.');

    } catch (err) {
      setError(err.response?.data?.error || 'Could not save. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Write a message"
      colors={colors}
      pinned={
        <View style={styles.fmtBar}>
          <Pressable style={[styles.fmtBtn, { borderColor: colors.line }]} onPress={() => wrap('**')}>
            <Text style={[styles.fmtB, { color: colors.ink }]}>B</Text>
          </Pressable>
          <Pressable style={[styles.fmtBtn, { borderColor: colors.line }]} onPress={() => wrap('*')}>
            <Text style={[styles.fmtI, { color: colors.ink }]}>I</Text>
          </Pressable>
          <Pressable style={[styles.fmtBtn, { borderColor: colors.line }]} onPress={() => wrap('__')}>
            <Text style={[styles.fmtU, { color: colors.ink }]}>U</Text>
          </Pressable>
          <Text style={[styles.fmtHint, { color: colors.muted }]}>Select text, then tap</Text>
        </View>
      }
    >
      <TextInput
        style={[styles.input, styles.textarea, { backgroundColor: colors.bg, color: colors.ink }]}
        placeholder="Your peace is a priority, not a luxury."
        placeholderTextColor={colors.muted}
        multiline
        value={text}
        onChangeText={setText}
        onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
      />

      {text ? (
        <View style={[styles.preview, { borderColor: colors.line }]}>
          <Text style={[styles.previewLabel, { color: colors.muted }]}>PREVIEW</Text>
          <RichText style={{ color: colors.ink, fontSize: 15, lineHeight: 22 }} text={text} />
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ color: colors.ink, fontSize: 14 }}>Personalize for a user</Text>
        <Switch
          value={personalize}
          onValueChange={(val) => {
            setPersonalize(val);
            if (!val) {
              setSelectedUser(null);
              setLikedAffirmations([]);
              setUserQuery('');
              setUserResults([]);
            }
          }}
        />
      </View>

      {personalize && !selectedUser ? (
        <View style={{ marginBottom: 12 }}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bg, color: colors.ink }]}
            placeholder="Search by name or email"
            placeholderTextColor={colors.muted}
            value={userQuery}
            onChangeText={setUserQuery}
          />
          {searching ? <ActivityIndicator color={colors.accent} /> : null}
          {userResults.map((u) => (
            <Pressable
              key={u._id}
              style={{ paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.line }}
              onPress={() => selectUser(u)}
            >
              <Text style={{ color: colors.ink }}>{u.name}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{u.email}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {personalize && selectedUser ? (
        <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.ink, fontWeight: '700' }}>{selectedUser.name}</Text>
            <Pressable onPress={() => { setSelectedUser(null); setLikedAffirmations([]); }}>
              <Text style={{ color: colors.accent }}>Change</Text>
            </Pressable>
          </View>
          {likedAffirmations.length > 0 ? (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>THEY'VE LIKED</Text>
              {likedAffirmations.slice(0, 5).map((a) => (
                <Text key={a.affirmationId} style={{ color: colors.ink, fontSize: 13, marginBottom: 4 }} numberOfLines={2}>
                  • {a.text}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>No liked messages yet.</Text>
          )}
        </View>
      ) : null}

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
            themeVariant={mode === 'dark' ? 'dark' : 'light'}
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

function Sheet({ visible, onClose, title, colors, children, pinned }) {
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
          {pinned}
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function VideoModal({ visible, onClose, colors }) {
  let [file, setFile] = useState(null);
  let [title, setTitle] = useState('');
  let [description, setDescription] = useState('');
  let [tier, setTier] = useState('paid');
  let [busy, setBusy] = useState(false);
  let [status, setStatus] = useState('');
  let [error, setError] = useState('');

  async function pick() {
    let perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Allow library access to upload a video.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length) {
      setFile(result.assets[0]);
      setError('');
    }
  }

  async function upload() {
    if (!file) {
      setError('Pick a video first.');
      return;
    }
    if (!title.trim()) {
      setError('Give it a title.');
      return;
    }

    setError('');
    setBusy(true);
    try {
      setStatus('Uploading to Cloudinary…');
      let uploaded = await adminApi.uploadVideo(file.uri);

      setStatus('Saving…');
      await videosApi.createVideo({
        title: title.trim(),
        description: description.trim(),
        videoUrl: uploaded.videoUrl,
        thumbnailUrl: uploaded.thumbnailUrl,
        duration: uploaded.duration,
        tier,
      });

      setFile(null);
      setTitle('');
      setDescription('');
      setTier('paid');
      onClose();
      Alert.alert('Uploaded', 'Your session is in the library.');
    } catch (err) {
      setError(err.message || 'Upload failed. Try again.');
    } finally {
      setBusy(false);
      setStatus('');
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Upload a video" colors={colors}>
      <Pressable
        style={[styles.input, { backgroundColor: colors.bg, justifyContent: 'center' }]}
        onPress={pick}
      >
        <Text style={{ color: file ? colors.ink : colors.muted, fontSize: 14 }}>
          {file ? `Selected · ${(file.fileSize / 1048576).toFixed(1)} MB` : 'Choose a video'}
        </Text>
      </Pressable>

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

      {status ? <Text style={[styles.error, { color: colors.muted }]}>{status}</Text> : null}
      {error ? <Text style={[styles.error, { color: colors.accent }]}>{error}</Text> : null}

      <Pressable
        style={[styles.btn, { backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 }]}
        onPress={upload}
        disabled={busy}
      >
        <Text style={[styles.btnText, { color: colors.surface }]}>
          {busy ? 'Working…' : 'Upload'}
        </Text>
      </Pressable>
    </Sheet>
  );
}

function PromoModal({ visible, onClose, colors }) {
  let [code, setCode] = useState('');
  let [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      adminApi.getPromo().then((c) => setCode(c || '')).catch(() => {});
    }
  }, [visible]);

  async function save() {
    if (!code.trim()) {
      Alert.alert('Code required', 'Enter a reward code.');
      return;
    }
    setBusy(true);
    try {
      await adminApi.setPromo(code.trim());
      onClose();
      Alert.alert('Saved', 'Your reward code is set.');
    } catch (err) {
      Alert.alert('Could not save', 'Try again in a moment.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Reward code" colors={colors}>
      <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19, marginBottom: 14 }}>
        Members who reach a 30-day streak can reveal this code.
      </Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.bg, color: colors.ink }]}
        placeholder="e.g. HOL30LOVE"
        placeholderTextColor={colors.muted}
        autoCapitalize="characters"
        value={code}
        onChangeText={setCode}
      />
      <Pressable
        style={[styles.btn, { backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 }]}
        onPress={save}
        disabled={busy}
      >
        <Text style={[styles.btnText, { color: colors.surface }]}>{busy ? 'Saving…' : 'Save code'}</Text>
      </Pressable>
    </Sheet>
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
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 34, maxHeight: '88%' },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  sheetTitle: { fontSize: 18, fontWeight: '600' },
  input: { borderRadius: 12, padding: 14, fontSize: 14, marginBottom: 12 },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  error: { fontSize: 13, marginBottom: 10 },
  tierToggle: { flexDirection: 'row', borderWidth: 1, borderRadius: 100, overflow: 'hidden', marginBottom: 14 },
  tierBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  fmtBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  fmtBtn: { width: 38, height: 34, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  fmtB: { fontSize: 15, fontWeight: '800' },
  fmtI: { fontSize: 15, fontStyle: 'italic', fontWeight: '600' },
  fmtU: { fontSize: 15, fontWeight: '600', textDecorationLine: 'underline' },
  fmtHint: { fontSize: 11, marginLeft: 4 },
  preview: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  previewLabel: { fontSize: 9.5, fontWeight: '700', letterSpacing: 1.2, marginBottom: 6 },
});