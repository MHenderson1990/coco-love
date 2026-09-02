import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Share, Alert, Platform, KeyboardAvoidingView, ScrollView, ImageBackground } from 'react-native';
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
import { BlurView } from 'expo-blur';
import { PHOTOS } from '../theme/photos';
import { ExtensionStorage } from '@bacons/apple-targets';

let widgetStorage = new ExtensionStorage('group.com.coco.houseoflove');


export default function TodayScreen({ navigation }) {
  let { colors, background, todayPhoto, themeReady } = useTheme();
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

        let isPinned = await widgetStorage.get('widgetIsPinned');
        if (!isPinned) {
          widgetStorage.set('widgetAffirmationText', today.text);
          widgetStorage.set('widgetStreak', String(streak));
          ExtensionStorage.reloadWidget();
        }
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

  if (loading || !themeReady) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

    let bgSource = todayPhoto && todayPhoto.startsWith('http')
      ? { uri: todayPhoto }
      : (PHOTOS[todayPhoto] || PHOTOS.default);

    return (
    <ImageBackground source={bgSource} style={{ flex: 1 }} resizeMode="cover">
    <SafeAreaView style={[styles.wrap, { backgroundColor: 'transparent' }]} edges={['top']}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        <StreakRing streak={streak} />
        <AnnouncementBanner onPress={() => navigation.navigate('Announcements')} />

        <View style={styles.greet}>
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.hello, { color: '#fff' }]}>{'Peace\u2009&\u2009love'}</Text>
            <Text style={[styles.name, { color: '#fff' }]}>{user?.name}</Text>
          </View>

          <TypewriterText
            key={revealed ? 'revealed-message' : 'opening-message'}
            style={[styles.sub, {  color: '#fff' , textAlign: 'center' }]}
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
              <Pressable style={styles.actWrap} onPress={handleSave}>
                <BlurView intensity={30} tint="dark" style={[styles.act, saved && styles.actSaved]}>
                  <Text style={[styles.actText, { color: '#fff' }]}>{saved ? 'Saved' : 'Save'}</Text>
                </BlurView>
              </Pressable>

              <Pressable style={styles.actWrap} onPress={handleShare}>
                <BlurView intensity={30} tint="dark" style={styles.act}>
                  <Text style={[styles.actText, { color: '#fff' }]}>Share</Text>
                </BlurView>
              </Pressable>

              <Pressable style={styles.actWrap} onPress={() => handleFeedback('more')}>
                <BlurView intensity={30} tint="dark" style={styles.act}>
                  <Text style={[styles.actText, { color: '#fff' }]}>More like this</Text>
                </BlurView>
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
    </ImageBackground>
  );
}

let styles = StyleSheet.create({
  wrap: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 40, justifyContent: 'flex-start' },
  greet: { marginTop: 22 },
  hello: { fontSize: 50, fontFamily: 'BebasNeue_400Regular', letterSpacing: .5 },
  greetRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' },
  name: { fontSize: 55, fontFamily: 'PassionsConflict_400Regular', marginTop: -25, textAlign: 'center' },
  sub: { fontSize: 15, fontFamily: 'PlayfairDisplay_400Regular' },
  errorBox: { minHeight: 260, marginTop: 16, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  actWrap: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  act: { paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  actSaved: { backgroundColor: 'rgba(255,255,255,0.22)' },
  actText: { fontSize: 11, fontWeight: '600' },
  actText: { fontSize: 11, fontWeight: '600' },
});