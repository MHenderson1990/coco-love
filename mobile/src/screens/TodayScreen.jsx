import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import StreakRing from '../components/StreakRing';
import RevealCard from '../components/RevealCard';
import * as affirmationsApi from '../api/affirmations';
import * as userApi from '../api/user';
import * as favoritesApi from '../api/favorites';
import * as feedbackApi from '../api/feedback';

export default function TodayScreen() {
  let { colors } = useTheme();
  let { user } = useAuth();

  let [affirmation, setAffirmation] = useState(null);
  let [streak, setStreak] = useState(0);
  let [revealed, setRevealed] = useState(false);
  let [saved, setSaved] = useState(false);
  let [loading, setLoading] = useState(true);
  let [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        let [checkin, today] = await Promise.all([
          userApi.checkIn(),
          affirmationsApi.getToday(),
        ]);
        setStreak(checkin.currentStreak);
        setAffirmation(today);
      } catch (err) {
        setError(err.response?.data?.error || 'Could not load today’s message.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    if (!affirmation) return;
    try {
      if (saved) {
        await favoritesApi.removeFavorite(affirmation._id);
        setSaved(false);
      } else {
        await favoritesApi.addFavorite(affirmation._id);
        setSaved(true);
      }
    } catch (err) {
      if (err.response?.status === 409) setSaved(true);
    }
  }

  async function handleShare() {
    if (!affirmation) return;
    try {
      await Share.share({ message: affirmation.text });
    } catch (err) {
      // user cancelled
    }
  }

  async function handleFeedback(signal) {
    if (!affirmation) return;
    try {
      await feedbackApi.sendFeedback(affirmation._id, signal);
      Alert.alert('Thanks', 'We’ll keep that in mind.');
    } catch (err) {
      // non-blocking
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={styles.body}>
        <StreakRing streak={streak} />

        <View style={styles.greet}>
          <Text style={[styles.hello, { color: colors.ink }]}>
            Peace and love, {user?.name}
          </Text>
          <Text style={[styles.sub, { color: colors.muted }]}>
            {revealed ? 'Take it with you today.' : 'Are you ready for today’s message?'}
          </Text>
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <Text style={{ color: colors.muted, textAlign: 'center' }}>{error}</Text>
          </View>
        ) : (
          <RevealCard
            text={affirmation?.text}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
          />
        )}

        {revealed && (
          <View style={styles.actions}>
            <Pressable
              style={[
                styles.act,
                { backgroundColor: saved ? colors.accentSoft : colors.surface, borderColor: saved ? colors.accent : colors.line },
              ]}
              onPress={handleSave}
            >
              <Text style={[styles.actText, { color: saved ? colors.accent : colors.muted }]}>
                {saved ? 'Saved' : 'Save'}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.act, { backgroundColor: colors.surface, borderColor: colors.line }]}
              onPress={handleShare}
            >
              <Text style={[styles.actText, { color: colors.muted }]}>Share</Text>
            </Pressable>

            <Pressable
              style={[styles.act, { backgroundColor: colors.surface, borderColor: colors.line }]}
              onPress={() => handleFeedback('more')}
            >
              <Text style={[styles.actText, { color: colors.muted }]}>More like this</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

let styles = StyleSheet.create({
  wrap: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, paddingHorizontal: 22, paddingBottom: 20 },
  greet: { marginTop: 22 },
  hello: { fontSize: 25, fontWeight: '500', letterSpacing: -0.4, marginBottom: 7 },
  sub: { fontSize: 14 },
  errorBox: { flex: 1, marginTop: 16, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  act: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  actText: { fontSize: 11, fontWeight: '600' },
});