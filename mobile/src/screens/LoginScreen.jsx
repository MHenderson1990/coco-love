import { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, Animated, Easing,ScrollView, ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// a scatter of stars — generated once
function useStars(count = 34) {
  return useMemo(
    () =>
      Array.from({ length: count }, () => ({
        top: `${Math.random() * 62}%`,
        left: `${Math.random() * 92 + 2}%`,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 2200,
        duration: 1400 + Math.random() * 1800,
      })),
    []
  );
}

function Star({ top, left, size, delay, duration }) {
  let twinkle = useRef(new Animated.Value(Math.random())).current;

  useEffect(() => {
    let loop = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, { toValue: 1, duration, delay, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(twinkle, { toValue: 0.2, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top, left,
        width: size, height: size, borderRadius: size,
        backgroundColor: '#F0EBF7',
        opacity: twinkle,
      }}
    />
  );
}

export default function LoginScreen({ navigation }) {
  let { colors } = useTheme();
  let { login, restoreSession, hasStoredSession } = useAuth();
  let stars = useStars();

  let [email, setEmail] = useState('');
  let [password, setPassword] = useState('');
  let [showPassword, setShowPassword] = useState(false);
  let [error, setError] = useState('');
  let [busy, setBusy] = useState(false);
  let [focused, setFocused] = useState(null);
  let [showFaceID, setShowFaceID] = useState(false);
  let [faceIDBusy, setFaceIDBusy] = useState(false);

  useEffect(() => {
    async function checkFaceIDAvailable() {
      let hasSession = await hasStoredSession();
      if (!hasSession) return;
      let hasHardware = await LocalAuthentication.hasHardwareAsync();
      let isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (hasHardware && isEnrolled) {
        setShowFaceID(true);
      }
    }
    checkFaceIDAvailable();
  }, []);

  async function handleFaceIDLogin() {
    setError('');
    setFaceIDBusy(true);
    try {
    let success = await restoreSession({ requireBiometric: true });
      if (!success) setError('Face ID didn’t match. Enter your password instead.');
    } finally {
      setFaceIDBusy(false);
    }
  }

  let fade = useRef(new Animated.Value(0)).current;
  let rise = useRef(new Animated.Value(20)).current;
  let moonGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(moonGlow, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(moonGlow, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  async function handleLogin() {
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  let glowScale = moonGlow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
  let glowOpacity = moonGlow.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.4] });

  // deep celestial base tuned to the active accent
  let sky = colors.bg;

  return (
    <KeyboardAvoidingView
      style={[styles.wrap, { backgroundColor: sky }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* starfield */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {stars.map((s, i) => <Star key={i} {...s} />)}
      </View>

    <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

      <Animated.View style={[styles.content, { opacity: fade, transform: [{ translateY: rise }] }]}>
        {/* moon with breathing glow */}
        <View style={styles.moonWrap}>
          <Animated.View
            style={[
              styles.moonGlow,
              { backgroundColor: colors.accent, opacity: glowOpacity, transform: [{ scale: glowScale }] },
            ]}
          />
          <Text style={[styles.moon, { color: colors.accentSoft }]}>☾</Text>
        </View>

        <Text style={[styles.title, { color: colors.ink }]}>Love G.E.M.S.</Text>
        <Text style={[styles.tagline, { color: colors.muted }]}>Peace and love, friend. Sign in to begin.</Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              color: colors.ink,
              borderColor: focused === 'email' ? colors.accent : colors.line,
            },
          ]}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          onFocus={() => setFocused('email')}
          onBlur={() => setFocused(null)}
        />

        <View style={styles.passwordWrap}>
          <TextInput
            style={[
              styles.input,
              styles.passwordInput,
              {
                backgroundColor: colors.surface,
                color: colors.ink,
                borderColor: focused === 'password' ? colors.accent : colors.line,
              },
            ]}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocused('password')}
            onBlur={() => setFocused(null)}
          />
          <Pressable style={styles.eyeButton} onPress={() => setShowPassword((v) => !v)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.muted}
            />
          </Pressable>
        </View>

        {showFaceID && (
          <Pressable
            style={[styles.faceIDButton, { backgroundColor: colors.surface, borderColor: colors.line }]}
            onPress={handleFaceIDLogin}
            disabled={faceIDBusy}
          >
            <MaterialCommunityIcons name="face-recognition" size={22} color={colors.accent} />
          </Pressable>
        )}

        {error ? <Text style={[styles.error, { color: colors.accent }]}>{error}</Text> : null}

        <Pressable
          style={[styles.button, { backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 }]}
          onPress={handleLogin}
          disabled={busy}
        >
          <Text style={[styles.buttonText, { color: colors.surface }]}>
            {busy ? 'Entering…' : 'Enter'}
          </Text>
        </Pressable>

        <View style={styles.linkRow}>
          <Pressable onPress={() => navigation.navigate('Signup')}>
            <Text style={[styles.link, { color: colors.muted }]}>Create an account</Text>
          </Pressable>
          <Text style={{ color: colors.muted }}>  ·  </Text>
          <Pressable onPress={() => navigation.navigate('ResetPassword')}>
            <Text style={[styles.link, { color: colors.muted }]}>Forgot password?</Text>
          </Pressable>
        </View>
      </Animated.View>
      </ScrollView>

      {(busy || faceIDBusy) && (
        <View style={[styles.loadingOverlay, { backgroundColor: sky }]}>
          <Text style={[styles.loadingMoon, { color: colors.accentSoft }]}>☾</Text>
          <ActivityIndicator size="large" color={colors.accent} style={{ marginBottom: 18 }} />
          <Text style={[styles.loadingText, { color: colors.ink }]}>Love loading…</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

let styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  content: { alignItems: 'center' },
  moonWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  moonGlow: { position: 'absolute', width: 70, height: 70, borderRadius: 35 },
  moon: { fontSize: 40 },
  title: { fontSize: 30, fontWeight: '600', letterSpacing: -0.5, marginBottom: 6 },
  tagline: { fontSize: 10.5, letterSpacing: 2, marginBottom: 34 },
  input: {
    alignSelf: 'stretch',
    borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 12,
  },
  passwordWrap: { alignSelf: 'stretch', justifyContent: 'center' },
  passwordInput: { paddingRight: 46 },
  eyeButton: { position: 'absolute', right: 14, top: 0, bottom: 12, justifyContent: 'center' },
  faceIDButton: {
    alignSelf: 'center', width: 42, height: 42, borderRadius: 21,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  error: { alignSelf: 'stretch', fontSize: 13, marginBottom: 12 },
  button: {
    alignSelf: 'stretch',
    borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  buttonText: { fontSize: 15, fontWeight: '700' },
  link: { textAlign: 'center', fontSize: 14, marginTop: 20 },
  linkRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, flexWrap: 'wrap' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingMoon: { fontSize: 44, marginBottom: 20 },
  loadingText: { fontSize: 15, fontWeight: '600', letterSpacing: 1 },
});