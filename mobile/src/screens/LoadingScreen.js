import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function LoadingScreen() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.moon}>☾</Text>
      <ActivityIndicator size="large" color="#fff" style={{ marginBottom: 18 }} />
      <Text style={styles.text}>Love loading…</Text>
    </View>
  );
}

let styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#281964' },
  moon: { fontSize: 44, marginBottom: 20, color: 'rgba(255,255,255,0.6)' },
  text: { fontSize: 15, fontWeight: '600', letterSpacing: 1, color: '#fff' },
});