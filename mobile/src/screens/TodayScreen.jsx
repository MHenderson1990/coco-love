import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Share, Alert, Platform, KeyboardAvoidingView, ScrollView, ImageBackground, Animated, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import RevealCard from '../components/RevealCard';
import * as affirmationsApi from '../api/affirmations';
import * as userApi from '../api/user';
import * as favoritesApi from '../api/favorites';
import * as feedbackApi from '../api/feedback';
import AnnouncementBanner from '../components/AnnouncementBanner';
import TypewriterText from '../components/TypewriterText';
import { BlurView } from 'expo-blur';
import { PHOTOS, LIGHT_PHOTOS } from '../theme/photos';
import { ExtensionStorage } from '@bacons/apple-targets';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { TodayAffirmationWidget } from '../../widgets/TodayAffirmationWidget';
import { Ionicons } from '@expo/vector-icons';

let widgetStorage = new ExtensionStorage('group.com.coco.houseoflove');


let BG_FADE = 2400; // how long the photo takes to fade in
let HELLO_DELAY = BG_FADE + 400;
let HELLO_SPEED = 80;
let HELLO_LEN = 12;
let NAME_SPEED = 90;
let PROMPT_LEN = 34;

export default function TodayScreen({ navigation }) {
  let { colors, background, todayPhoto, themeReady } = useTheme();
  let { user } = useAuth();
  let nameLen = (user?.name || '').length;
  let userId = user?._id || user?.id;
  let NAME_DELAY = HELLO_DELAY + HELLO_LEN * HELLO_SPEED + 300;
  let PROMPT_DELAY = NAME_DELAY + nameLen * NAME_SPEED + 500;
  let CARD_DELAY = PROMPT_DELAY + PROMPT_LEN * 45 + 500;

  let [affirmation, setAffirmation] = useState(null);
  let [streak, setStreak] = useState(user?.currentStreak ?? 0);
  let [revealed, setRevealed] = useState(false);
  let [instant, setInstant] = useState(false);
  let [runKey, setRunKey] = useState(0);
  let affRef = useRef(null);
  let [saved, setSaved] = useState(false);
  let [loading, setLoading] = useState(true);
  let [error, setError] = useState('');
  let cardFade = useRef(new Animated.Value(0)).current;
  let bgFade = useRef(new Animated.Value(0)).current;
  let promptFade = useRef(new Animated.Value(1)).current;
  let [cardReady, setCardReady] = useState(false);
  let scrollRef = useRef(null);
  let [controlsHidden, setControlsHidden] = useState(false);
  let controlsFade = useRef(new Animated.Value(1)).current;

  function toggleControls() {
    let next = !controlsHidden;
    setControlsHidden(next);
    Animated.timing(controlsFade, { toValue: next ? 0 : 1, duration: 200, useNativeDriver: true }).start();
  }

  useEffect(() => {
    async function load() {
      try {
       let today = await affirmationsApi.getToday();
        let seen = userId
          ? await AsyncStorage.getItem(`revealed:${userId}`).catch(() => null)
          : null;
        if (today?._id && seen === today._id) {
          setInstant(true);
          setRevealed(true);
          promptFade.setValue(0);
          cardFade.setValue(1);
          setCardReady(true);
        }
        setAffirmation(today);

      } catch (err) {
        setError(err.response?.data?.error || 'Could not load today\u2019s message.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

    useEffect(() => {
    affRef.current = affirmation;
  }, [affirmation]);

  // coming back to the app on a new day: start over with the new message
  useEffect(() => {
    let sub = AppState.addEventListener('change', async (state) => {
      if (state !== 'active') return;
      try {
        let today = await affirmationsApi.getToday();
        if (today?._id && affRef.current?._id && today._id !== affRef.current._id) {
          setRevealed(false);
          setInstant(false);
          setSaved(false);
          setControlsHidden(false);
          controlsFade.setValue(1);
          setCardReady(false);
          cardFade.setValue(0);
          promptFade.setValue(1);
          scrollRef.current?.scrollTo({ y: 0, animated: false });
          setAffirmation(today);
          setRunKey((k) => k + 1);
        }
      } catch (err) {
        // offline or server hiccup: keep showing what's there
      }
    });
    return () => sub.remove();
  }, []);

   useEffect(() => {
    if (loading) return undefined;
    Animated.timing(bgFade, {
      toValue: 1,
      duration: BG_FADE,
      useNativeDriver: true,
    }).start();
    Animated.timing(cardFade, {
      toValue: 1,
      duration: 1600,
      delay: CARD_DELAY,
      useNativeDriver: true,
    }).start();
    let t = setTimeout(() => setCardReady(true), CARD_DELAY);
    return () => clearTimeout(t);
  }, [loading, runKey]);

  useEffect(() => {
    if (!revealed) return;
    Animated.timing(promptFade, {
      toValue: 0,
      duration: 2200,
      useNativeDriver: true,
    }).start();
  }, [revealed]);

  async function handleReveal() {
    setRevealed(true);
    try {
      let checkin = await userApi.checkIn();
      setStreak(checkin.currentStreak);

      if (userId && affirmation?._id) {
        AsyncStorage.setItem(`revealed:${userId}`, affirmation._id).catch(() => {});
      }

      if (affirmation?.text) {
        if (Platform.OS === 'ios') {
          widgetStorage.set('widgetLastRevealedText', affirmation.text);
          let isPinned = widgetStorage.get('widgetIsPinned');
          if (!isPinned) {
            widgetStorage.set('widgetAffirmationText', affirmation.text);
          }
          ExtensionStorage.reloadWidget();
        } else if (Platform.OS === 'android') {
          await AsyncStorage.setItem('widgetLastRevealedText', affirmation.text);
          await AsyncStorage.setItem('widgetTodayPhoto', todayPhoto || 'sky');

          let isPinned = (await AsyncStorage.getItem('widgetIsPinned')) === '1';
          if (!isPinned) {
            await AsyncStorage.setItem('widgetAffirmationText', affirmation.text);
          }

          let displayText = isPinned
            ? await AsyncStorage.getItem('widgetAffirmationText')
            : affirmation.text;

          requestWidgetUpdate({
            widgetName: 'TodayAffirmation',
            renderWidget: () => (
              <TodayAffirmationWidget text={displayText} photoKey={todayPhoto || 'sky'} />
            ),
          });
        }
      }

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
      <View style={[styles.center, { backgroundColor: '#281964' }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

    let bgSource = todayPhoto && todayPhoto.startsWith('http')
      ? { uri: todayPhoto }
      : (PHOTOS[todayPhoto] || PHOTOS.sky);

    return (
    <View style={{ flex: 1, backgroundColor: '#281964' }}>
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgFade }]}>
    <ImageBackground source={bgSource} style={{ flex: 1 }} resizeMode="cover" />
    </Animated.View>
    <SafeAreaView style={[styles.wrap, { backgroundColor: 'transparent' }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        >
       <Pressable style={{ flexGrow: 1 }} onPress={revealed ? toggleControls : undefined}> 
        <AnnouncementBanner onPress={() => navigation.navigate('Announcements')} />

        <View style={styles.greet}>
          <View style={{ alignItems: 'center' }}>
            {instant ? (
              <>
                <Text style={[styles.hello, { color: '#fff', textAlign: 'center' }]}>{'Peace\u2009&\u2009love'}</Text>
                <Text style={[styles.name, { color: '#fff', textAlign: 'center' }]}>{user?.name || ''}</Text>
              </>
            ) : (
              <>
                <TypewriterText
                  key={`hello-${runKey}`}
                  style={[styles.hello, { color: '#fff', textAlign: 'center' }]}
                  text={'Peace\u2009&\u2009love'}
                  delay={HELLO_DELAY}
                  speed={HELLO_SPEED}
                />
                <TypewriterText
                  key={`name-${user?.name}-${runKey}`}
                  style={[styles.name, { color: '#fff', textAlign: 'center' }]}
                  text={user?.name || ''}
                  delay={NAME_DELAY}
                  speed={NAME_SPEED}
                />
              </>
            )}
          </View>

          <Animated.View style={{ opacity: promptFade }} pointerEvents="none">
            <TypewriterText
              key={`opening-message-${runKey}`}
              style={[styles.sub, { color: '#fff', textAlign: 'center' }]}
              text={'Are you ready for today\u2019s message?'}
              delay={PROMPT_DELAY}
              speed={45}
            />
          </Animated.View>
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: 'rgba(255,255,255,0.4)', borderColor: colors.line }]}>
            <Text style={{ color: colors.muted, textAlign: 'center' }}>{error}</Text>
          </View>
        ) : (
          <Animated.View
            style={{ opacity: cardFade }}
            pointerEvents={cardReady ? 'auto' : 'none'}
          >
            <RevealCard
              text={affirmation?.text}
              revealed={revealed}
              onReveal={handleReveal}
              onTap={toggleControls}
              instant={instant}
              darkSparkles={LIGHT_PHOTOS.includes(todayPhoto)}
            />
          </Animated.View>
        )}
        
        {revealed && (
         <Animated.View
            pointerEvents={controlsHidden ? 'none' : 'auto'}
            style={{ marginTop: 'auto', opacity: controlsFade }}
          >
            <View style={styles.actions}>
              <Pressable style={styles.actItem} onPress={handleSave}>
                <View style={[styles.actCircle, Platform.OS === 'android' && styles.androidBlurFallback, saved && styles.actSaved]}>
                  <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                  <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color="#fff" />
                </View>
                <Text style={styles.actText}>{saved ? 'Saved' : 'Save'}</Text>
              </Pressable>

              <Pressable style={styles.actItem} onPress={handleShare}>
                <View style={[styles.actCircle, Platform.OS === 'android' && styles.androidBlurFallback]}>
                  <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                  <Ionicons name="share-outline" size={22} color="#fff" />
                </View>
                <Text style={styles.actText}>Share</Text>
              </Pressable>

              <Pressable style={styles.actItem} onPress={() => handleFeedback('more')}>
                <View style={[styles.actCircle, Platform.OS === 'android' && styles.androidBlurFallback]}>
                  <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                  <Ionicons name="heart-outline" size={24} color="#fff" />
                </View>
                <Text style={styles.actText}>Love</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </View>
  );
}

let styles = StyleSheet.create({
  wrap: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 12, justifyContent: 'flex-start' },
  greet: { marginTop: 22 },
  hello: {
    fontSize: 54,
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 1,
    textShadowColor: 'rgba(201, 168, 255, 0.95)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  greetRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' },
  name: {
    fontSize: 66,
    fontFamily: 'PassionsConflict_400Regular',
    marginTop: -28,
    textAlign: 'center',
    textShadowColor: 'rgba(201, 168, 255, 0.95)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  sub: {
    fontSize: 15, fontFamily: 'PlayfairDisplay_400Regular',
    textShadowColor: 'rgba(20, 10, 40, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  errorBox: { minHeight: 260, marginTop: 16, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 32, marginTop: 14, paddingBottom: 8 },
  actItem: { alignItems: 'center', width: 64 },
  actCircle: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  actSaved: { backgroundColor: 'rgba(255,255,255,0.22)' },
  androidBlurFallback: { backgroundColor: 'rgba(0,0,0,0.45)' },
  actText: {
    fontSize: 11, fontWeight: '600', color: '#fff', marginTop: 6,
    textShadowColor: 'rgba(20, 10, 40, 0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
});