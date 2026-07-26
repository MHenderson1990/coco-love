import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import * as authApi from '../api/auth';

export default function ResetPasswordScreen({ navigation }) {
  let { colors } = useTheme();
  let [step, setStep] = useState(1); // 1 = enter email, 2 = enter code + new password
  let [email, setEmail] = useState('');
  let [code, setCode] = useState('');
  let [password, setPassword] = useState('');
  let [busy, setBusy] = useState(false);
  let [error, setError] = useState('');

  async function sendCode() {
    if (!email.trim()) { setError('Enter your email.'); return; }
    setError('');
    setBusy(true);
    try {
      await authApi.forgotPassword(email.trim());
      setStep(2);
    } catch (err) {
      setError('Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function submitReset() {
    if (!code.trim() || !password) { setError('Enter the code and a new password.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError('');
    setBusy(true);
    try {
      await authApi.resetPassword(email.trim(), code.trim(), password);
      Alert.alert('Done', 'Your password is updated. You can sign in now.', [
        { text: 'Sign in', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) {
      setError(err.response?.data?.error || 'That code is invalid or expired.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: colors.bg }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { color: colors.muted }]}>‹ Back</Text>
        </Pressable>

        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.ink }]}>Reset password</Text>

          {step === 1 ? (
            <>
              <Text style={[styles.sub, { color: colors.muted }]}>
                Enter your email and we'll send you a code.
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.ink, borderColor: colors.line }]}
                placeholder="Email"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              {error ? <Text style={[styles.error, { color: colors.accent }]}>{error}</Text> : null}
              <Pressable
                style={[styles.button, { backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 }]}
                onPress={sendCode}
                disabled={busy}
              >
                <Text style={[styles.buttonText, { color: colors.surface }]}>
                  {busy ? 'Sending…' : 'Send code'}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={[styles.sub, { color: colors.muted }]}>
                Enter the code we emailed to {email}, and choose a new password.
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.ink, borderColor: colors.line }]}
                placeholder="6-digit code"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                value={code}
                onChangeText={setCode}
              />
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.ink, borderColor: colors.line }]}
                placeholder="New password"
                placeholderTextColor={colors.muted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              {error ? <Text style={[styles.error, { color: colors.accent }]}>{error}</Text> : null}
              <Pressable
                style={[styles.button, { backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 }]}
                onPress={submitReset}
                disabled={busy}
              >
                <Text style={[styles.buttonText, { color: colors.surface }]}>
                  {busy ? 'Updating…' : 'Update password'}
                </Text>
              </Pressable>
              <Pressable onPress={sendCode} disabled={busy}>
                <Text style={[styles.link, { color: colors.muted }]}>Resend code</Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

let styles = StyleSheet.create({
  wrap: { flex: 1 },
  flex: { flex: 1, paddingHorizontal: 28 },
  back: { fontSize: 15, marginTop: 12 },
  body: { flex: 1, justifyContent: 'center', paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '600', letterSpacing: -0.5, marginBottom: 10 },
  sub: { fontSize: 14.5, lineHeight: 21, marginBottom: 24 },
  input: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 12 },
  error: { fontSize: 13, marginBottom: 12 },
  button: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { fontSize: 15, fontWeight: '700' },
  link: { textAlign: 'center', fontSize: 14, marginTop: 20 },
});