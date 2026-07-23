import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function TodayScreen() {
  let { colors } = useTheme();
  let { user, logout } = useAuth();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg }]}>
      <Text style={[styles.greet, { color: colors.ink }]}>Peace and love, {user?.name}</Text>
      <Text style={[styles.sub, { color: colors.muted }]}>Are you ready for today's message?</Text>

      <Pressable style={[styles.button, { backgroundColor: colors.accent }]} onPress={logout}>
        <Text style={[styles.buttonText, { color: colors.surface }]}>Sign out</Text>
      </Pressable>
    </View>
  );
}

let styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  greet: { fontSize: 28, fontWeight: '500', marginBottom: 8 },
  sub: { fontSize: 15, marginBottom: 32 },
  button: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  buttonText: { fontSize: 15, fontWeight: '700' },
});