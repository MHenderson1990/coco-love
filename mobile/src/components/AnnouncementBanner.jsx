import { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import * as announcementsApi from '../api/announcements';

export default function AnnouncementBanner({ onPress }) {
  let { colors } = useTheme();
  let [item, setItem] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        try {
          let list = await announcementsApi.listAnnouncements();
          if (!active || !list.length) return;

          let latest = list[0];
          let dismissed = await AsyncStorage.getItem('dismissedAnnouncement');
          if (active && dismissed !== latest._id) setItem(latest);
        } catch (err) {
          // non-blocking
        }
      }

      load();
      return () => { active = false; };
    }, [])
  );

  async function dismiss() {
    if (item) await AsyncStorage.setItem('dismissedAnnouncement', item._id);
    setItem(null);
  }

  if (!item) return null;

  return (
    <Pressable
      style={[styles.wrap, { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}
      onPress={onPress}
    >
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.ink }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.body, { color: colors.ink }]} numberOfLines={2}>{item.body}</Text>
      </View>
      <Pressable onPress={dismiss} hitSlop={12}>
        <Text style={[styles.close, { color: colors.ink }]}>✕</Text>
      </Pressable>
    </Pressable>
  );
}

let styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderWidth: 1, borderRadius: 15, padding: 14, marginTop: 14,
  },
  text: { flex: 1, gap: 4 },
  title: { fontSize: 13.5, fontWeight: '700' },
  body: { fontSize: 12.5, lineHeight: 18, opacity: 0.8 },
  close: { fontSize: 15, opacity: 0.5 },
});