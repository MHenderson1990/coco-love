import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Share, Alert, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import StreakRing from '../components/StreakRing';
import RevealCard from '../components/RevealCard';
import * as affirmationsApi from '../api/affirmations';
import * as userApi from '../api/user';
import * as favoritesApi from '../api/favorites';
import * as feedbackApi from '../api/feedback';
import JournalDrawer from '../components/JournalDrawer';
import AnnouncementBanner from '../components/AnnouncementBanner';
import TypewriterText from '../components/TypewriterText';


export default function TodayScreen({ navigation }) {
  let { colors, background } = useTheme();
  let { user } = useAuth();

  let [affirmation, setAffirmation] = useState(null);
  let [streak, setStreak] = useState(user?.currentStreak ?? 0);
  let [revealed, setRevealed] = useState(false);
  let [saved, setSaved] = useState(false);
  let [loading, setLoading] = useState(true);
  let [error, setError] = useState('');
  let [journalOpen, setJournalOpen] = useState(false);
  let scrollRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        let today = await affirmationsApi.getToday();
        setAffirmation(today);
      } catch (err) {
        setError(err.response?.data?.error || 'Could not load today\u2019s message.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleReveal() {
    setRevealed(true);
    try {
      let checkin = await userApi.checkIn();
      setStreak(checkin.currentStreak);
      if (checkin.promoJustUnlocked) {
        setTimeout(() => {
          Alert.alert(
            '30 days ✨',
            'You reached a 30-day streak. Your reward is waiting in the You tab.',
            [{ text: 'See it', onPress: () => navigation.navigate('Reward') }, { text: 'Later' }]
          );
        }, 600);
      }
    } catch (err) {
      // non-blocking — the message is still revealed even if the streak save fails
    }
  }

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
      // cancelled
    }
  }

  async function handleFeedback(signal) {
    if (!affirmation) return;
    try {
      await feedbackApi.sendFeedback(affirmation._id, signal);
      Alert.alert('Thanks', 'We\u2019ll keep that in mind.');
    } catch (err) {
      // non-blocking
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: 'transparent' }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: 'transparent' }]} edges={['top']}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <StreakRing streak={streak} />
        <AnnouncementBanner onPress={() => navigation.navigate('Announcements')} />

        <View style={styles.greet}>
          <View style={styles.greetRow}>
            <Text style={[styles.hello, { color: colors.accent }]}>{'Peace\u2009&\u2009Love,'}</Text>
            <Text style={[styles.name, { color: colors.ink }]}>{user?.name}</Text>
          </View>

          <TypewriterText
            key={revealed ? 'revealed-message' : 'opening-message'}
            style={[styles.sub, { color: colors.muted }]}
            text={
              revealed
                ? 'Take it with you today.'
                : 'Are you ready for today\u2019s message?'
            }
            delay={500}
            speed={45}
          />
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: 'rgba(255,255,255,0.4)', borderColor: colors.line }]}>
            <Text style={{ color: colors.muted, textAlign: 'center' }}>{error}</Text>
          </View>
        ) : (
          <RevealCard
            text={affirmation?.text}
            revealed={revealed}
            onReveal={handleReveal}
            compact={journalOpen}
          />
        )}

        {revealed && (
          <>
            <View style={styles.actions}>
              <Pressable
                style={[
                  styles.act,
                  { backgroundColor: saved ? colors.accentSoft : 'rgba(255,255,255,0.4)', borderColor: saved ? colors.accent : colors.line },
                ]}
                onPress={handleSave}
              >
                <Text style={[styles.actText, { color: saved ? colors.accent : colors.muted }]}>
                  {saved ? 'Saved' : 'Save'}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.act, { backgroundColor: 'rgba(255,255,255,0.4)', borderColor: colors.line }]}
                onPress={handleShare}
              >
                <Text style={[styles.actText, { color: colors.muted }]}>Share</Text>
              </Pressable>

              <Pressable
                style={[styles.act, { backgroundColor: 'rgba(255,255,255,0.4)', borderColor: colors.line }]}
                onPress={() => handleFeedback('more')}
              >
                <Text style={[styles.actText, { color: colors.muted }]}>More like this</Text>
              </Pressable>
            </View>

            <JournalDrawer
              affirmationId={affirmation?._id}
              onOpenChange={(open) => {
                setJournalOpen(open);
                if (open) {
                  setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
                }
              }}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

let styles = StyleSheet.create({
  wrap: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 34 },
  greet: { marginTop: 22 },
  hello: { fontSize: 40, fontFamily: 'ShadowsIntoLight_400Regular', letterSpacing: 0 },
  greetRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' },
  name: { fontSize: 50, fontFamily: 'Allison_400Regular', marginLeft: 4 },
  sub: { fontSize: 15, fontFamily: 'PlayfairDisplay_400Regular' },
  errorBox: { minHeight: 260, marginTop: 16, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  act: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  actText: { fontSize: 11, fontWeight: '600' },
});