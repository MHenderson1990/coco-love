import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function SignupScreen({ navigation }) {
  let { colors } = useTheme();
  let { signup } = useAuth();

  let [name, setName] = useState('');
  let [email, setEmail] = useState('');
  let [password, setPassword] = useState('');
  let [birthday, setBirthday] = useState(null);
  let [showPicker, setShowPicker] = useState(false);
  let [error, setError] = useState('');
  let [busy, setBusy] = useState(false);

  function onDateChange(event, selectedDate) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'dismissed') return;
    if (selectedDate) setBirthday(selectedDate);
  }

  function formatBirthday(date) {
    if (!date) return 'Birthday (optional)';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  async function handleSignup() {
    setError('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Name, email, and password are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setBusy(true);
    try {
      await signup(email.trim(), password, name.trim(), birthday ? birthday.toISOString() : undefined);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.ink }]}>Create your account</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>A message every morning, just for you.</Text>

        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.ink, borderColor: colors.line }]}
          placeholder="Name"
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={setName}
        />

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

        <Pressable
          style={[styles.input, styles.dateField, { backgroundColor: colors.surface, borderColor: colors.line }]}
          onPress={() => setShowPicker(true)}
        >
          <Text style={{ fontSize: 15, color: birthday ? colors.ink : colors.muted }}>
            {formatBirthday(birthday)}
          </Text>
        </Pressable>

        {showPicker && (
          <View style={[styles.pickerWrap, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <DateTimePicker
              value={birthday || new Date(1995, 0, 1)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={onDateChange}
              themeVariant={colors.bg === '#171422' ? 'dark' : 'light'}
            />
            {Platform.OS === 'ios' && (
              <Pressable style={styles.doneBtn} onPress={() => setShowPicker(false)}>
                <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 15 }}>Done</Text>
              </Pressable>
            )}
          </View>
        )}

        {error ? <Text style={[styles.error, { color: colors.accent }]}>{error}</Text> : null}

        <Pressable
          style={[styles.button, { backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 }]}
          onPress={handleSignup}
          disabled={busy}
        >
          <Text style={[styles.buttonText, { color: colors.surface }]}>
            {busy ? 'Creating account…' : 'Create account'}
          </Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.link, { color: colors.muted }]}>Already have an account? Sign in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

let styles = StyleSheet.create({
  wrap: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 },
  title: { fontSize: 30, fontWeight: '500', marginBottom: 8, letterSpacing: -0.5 },
  sub: { fontSize: 15, marginBottom: 28 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 12 },
  dateField: { justifyContent: 'center' },
  pickerWrap: { borderWidth: 1, borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
  doneBtn: { alignItems: 'center', paddingVertical: 12 },
  error: { fontSize: 13, marginBottom: 12 },
  button: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { fontSize: 15, fontWeight: '700' },
  link: { textAlign: 'center', fontSize: 14, marginTop: 20 },
});