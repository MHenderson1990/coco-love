import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function LoadingScreen() {
  let { colors } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg }]}>
      <Text style={[styles.moon, { color: colors.accentSoft }]}>☾</Text>
      <ActivityIndicator size="large" color={colors.accent} style={{ marginBottom: 18 }} />
      <Text style={[styles.text, { color: colors.ink }]}>Love loading…</Text>
    </View>
  );
}

let styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  moon: { fontSize: 44, marginBottom: 20 },
  text: { fontSize: 15, fontWeight: '600', letterSpacing: 1 },
});