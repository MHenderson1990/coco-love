import { useState } from 'react';
import { Pressable, Text, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../context/ThemeContext';
import * as journalApi from '../api/journal';

// source: either { key } (remote, saved entry) or { uri } (local, recorder review)
export default function ShareVoiceButton({ source, label = 'Save to phone' }) {
  let { colors } = useTheme();
  let [busy, setBusy] = useState(false);

  async function share() {
    if (busy) return;
    setBusy(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Not available', 'Sharing isn’t available on this device.');
        return;
      }
      let uri = source.uri || (await journalApi.downloadVoiceNote(source.key));
      await Sharing.shareAsync(uri, { mimeType: 'audio/m4a', dialogTitle: 'Save voice note' });
    } catch (err) {
      Alert.alert('Could not save', 'Try again in a moment.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Pressable style={styles.btn} onPress={share} hitSlop={8} disabled={busy}>
      {busy ? <ActivityIndicator color={colors.muted} /> : <Ionicons name="share-outline" size={16} color={colors.muted} />}
      <Text style={[styles.text, { color: colors.muted }]}>{label}</Text>
    </Pressable>
  );
}

let styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { fontSize: 12.5, fontWeight: '600' },
});