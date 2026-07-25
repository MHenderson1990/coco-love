import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { PALETTES, PALETTE_KEYS, BACKGROUNDS } from '../theme/palettes';
import { usePushToken } from '../hooks/usePushToken';
import { updateMe } from '../api/user';

function timeStringToDate(hhmm) {
  let [h, m] = (hhmm || '08:00').split(':').map(Number);
  let d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function dateToTimeString(date) {
  let h = String(date.getHours()).padStart(2, '0');
  let m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function formatTimeDisplay(hhmm) {
  return timeStringToDate(hhmm).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function ProfileScreen({ navigation }) {
  let { colors, palette, setPalette, mode, setMode, background, setBackground } = useTheme();
  let { user, logout } = useAuth();
  let { expoPushToken, error: pushError } = usePushToken();

  let [notificationsEnabled, setNotificationsEnabled] = useState(true);
  let [notificationTime, setNotificationTime] = useState('08:00');
  let [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (user) {
      setNotificationsEnabled(user.notificationsEnabled ?? true);
      setNotificationTime(user.notificationTime ?? '08:00');
    }
  }, [user?._id]);

  async function toggleNotificationsEnabled(next) {
    setNotificationsEnabled(next);
    try {
      await updateMe({ notificationsEnabled: next });
    } catch (err) {
      // keep the local change even if the save fails
    }
  }

  async function onTimeChange(event, selectedDate) {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'dismissed') return;
    if (!selectedDate) return;
    let next = dateToTimeString(selectedDate);
    setNotificationTime(next);
    try {
      await updateMe({ notificationTime: next });
    } catch (err) {
      // keep the local change even if the save fails
    }
  }

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: 'transparent' }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={[styles.title, { color: colors.ink }]}>Make it yours</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>{user?.name} · {user?.email}</Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[styles.label, { color: colors.ink }]}>Appearance</Text>
          <View style={[styles.toggle, { borderColor: colors.line }]}>
            {['light', 'dark'].map((m) => (
              <Pressable
                key={m}
                style={[styles.toggleBtn, mode === m && { backgroundColor: colors.accent }]}
                onPress={() => setMode(m)}
              >
                <Text style={[styles.toggleText, { color: mode === m ? colors.surface : colors.muted }]}>
                  {m === 'light' ? 'Light' : 'Dark'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[styles.label, { color: colors.ink }]}>Color</Text>
          <View style={styles.swatches}>
            {PALETTE_KEYS.map((key) => (
              <Pressable
                key={key}
                style={[
                  styles.swatch,
                  { backgroundColor: PALETTES[key][mode].accent },
                  palette === key && { borderWidth: 3, borderColor: colors.ink },
                ]}
                onPress={() => setPalette(key)}
              />
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[styles.label, { color: colors.ink }]}>Background</Text>
          <View style={styles.swatches}>
            {BACKGROUNDS.map((key) => (
              <Pressable
                key={key}
                onPress={() => {
                  console.log('tapped background:', key);
                  setBackground(key);
                }}
                style={[
                  styles.bgSwatch,
                  { backgroundColor: key === 'gradient' ? colors.accentSoft : key === 'glow' ? colors.accent : colors.bg, borderColor: colors.line },
                  background === key && { borderWidth: 3, borderColor: colors.ink },
                ]}
              >
                <Text style={{ fontSize: 8, color: colors.muted, textAlign: 'center', marginTop: 20 }}>{key}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.ink }]}>Daily reminder</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotificationsEnabled}
              trackColor={{ true: colors.accent }}
            />
          </View>

          {notificationsEnabled && (
            <>
              <Pressable
                style={[styles.timeField, { backgroundColor: colors.bg, borderColor: colors.line }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={{ fontSize: 15, color: colors.ink }}>{formatTimeDisplay(notificationTime)}</Text>
              </Pressable>

              {showTimePicker && (
                <View style={[styles.pickerWrap, { backgroundColor: colors.bg, borderColor: colors.line }]}>
                  <DateTimePicker
                    value={timeStringToDate(notificationTime)}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onTimeChange}
                    themeVariant={colors.bg === '#171422' ? 'dark' : 'light'}
                  />
                  {Platform.OS === 'ios' && (
                    <Pressable style={styles.doneBtn} onPress={() => setShowTimePicker(false)}>
                      <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 15 }}>Done</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </>
          )}

          {!expoPushToken && pushError && (
            <Text style={{ fontSize: 12, color: colors.muted }}>{pushError}</Text>
          )}
        </View>

        {user?.promoUnlockedAt && (
          <Pressable
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.accent }]}
            onPress={() => navigation.navigate('Reward')}
          >
            <Text style={[styles.label, { color: colors.ink }]}>✨ Your reward</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: -8 }}>
              You reached 30 days — tap to reveal
            </Text>
          </Pressable>
        )}

        <Pressable
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}
          onPress={() => navigation.navigate('Journal')}
        >
          <Text style={[styles.label, { color: colors.ink }]}>Your journal</Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: -8 }}>
            Everything you've written
          </Text>
        </Pressable>

        <Pressable
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}
          onPress={() => navigation.navigate('Announcements')}
        >
          <Text style={[styles.label, { color: colors.ink }]}>From Coco</Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: -8 }}>
            News and notes
          </Text>
        </Pressable>

        {user?.role === 'admin' && (
          <Pressable
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}
            onPress={() => navigation.navigate('Admin')}
          >
            <Text style={[styles.label, { color: colors.ink }]}>Your dashboard</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: -8 }}>
              Members, messages, and announcements
            </Text>
          </Pressable>
        )}

        <Pressable
          style={[styles.signout, { borderColor: colors.line, backgroundColor: colors.surface }]}
          onPress={logout}
        >
          <Text style={[styles.signoutText, { color: colors.accent }]}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

let styles = StyleSheet.create({
  wrap: { flex: 1 },
  body: { paddingHorizontal: 22, paddingBottom: 30 },
  title: { fontSize: 24, fontWeight: '500', marginTop: 18, letterSpacing: -0.4 },
  sub: { fontSize: 13.5, marginTop: 5, marginBottom: 18 },
  card: { borderWidth: 1, borderRadius: 15, padding: 16, marginBottom: 10, gap: 14 },
  label: { fontSize: 13.5, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeField: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, alignSelf: 'flex-start' },
  pickerWrap: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  doneBtn: { alignItems: 'center', paddingVertical: 12 },
  toggle: { flexDirection: 'row', borderWidth: 1, borderRadius: 100, overflow: 'hidden', alignSelf: 'flex-start' },
  toggleBtn: { paddingVertical: 8, paddingHorizontal: 20 },
  toggleText: { fontSize: 12, fontWeight: '700' },
  swatches: { flexDirection: 'row', gap: 12 },
  swatch: { width: 40, height: 40, borderRadius: 20 },
  signout: { borderWidth: 1, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 12 },
  signoutText: { fontSize: 14, fontWeight: '700' },
  bgSwatch: { width: 44, height: 56, borderRadius: 10, borderWidth: 1 },
});