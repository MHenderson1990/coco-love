import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen({ navigation }) {
  let { colors } = useTheme();
  let { login } = useAuth();

  let [email, setEmail] = useState('');
  let [password, setPassword] = useState('');
  let [error, setError] = useState('');
  let [busy, setBusy] = useState(false);

  async function handleLogin() {
    console.log('API URL:', process.env.EXPO_PUBLIC_API_URL);
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

  return (
    <KeyboardAvoidingView
      style={[styles.wrap, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={[styles.title, { color: colors.ink }]}>House of Love</Text>
      <Text style={[styles.sub, { color: colors.muted }]}>Peace and love, friend. Sign in to begin.</Text>

      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.ink, borderColor: colors.line }]}
        placeholder="Email"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.ink, borderColor: colors.line }]}
        placeholder="Password"
        placeholderTextColor={colors.muted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={[styles.error, { color: colors.accent }]}>{error}</Text> : null}

      <Pressable
        style={[styles.button, { backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 }]}
        onPress={handleLogin}
        disabled={busy}
      >
        <Text style={[styles.buttonText, { color: colors.surface }]}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Signup')}>
        <Text style={[styles.link, { color: colors.muted }]}>
          New here? Create an account
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

let styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  title: { fontSize: 34, fontWeight: '500', marginBottom: 8, letterSpacing: -0.5 },
  sub: { fontSize: 15, marginBottom: 32 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 12 },
  error: { fontSize: 13, marginBottom: 12 },
  button: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { fontSize: 15, fontWeight: '700' },
  link: { textAlign: 'center', fontSize: 14, marginTop: 20 },
});