import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import * as userApi from '../api/user';

export default function RewardScreen({ navigation }) {
  let { colors } = useTheme();
  let [code, setCode] = useState(null);
  let [loading, setLoading] = useState(true);
  let [locked, setLocked] = useState(false);

  useEffect(() => {
    userApi.getMyPromo()
      .then((data) => setCode(data.code))
      .catch((err) => {
        if (err.response?.status === 403) setLocked(true);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: 'transparent' }]} edges={['top']}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={[styles.back, { color: colors.muted }]}>‹ Back</Text>
      </Pressable>

      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : locked ? (
          <>
            <Text style={styles.emoji}>🔒</Text>
            <Text style={[styles.title, { color: colors.ink }]}>Not yet</Text>
            <Text style={[styles.sub, { color: colors.muted }]}>
              Reach a 30-day streak to unlock your reward. Keep going — you've got this.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.emoji}>✨</Text>
            <Text style={[styles.title, { color: colors.ink }]}>Your reward</Text>
            <Text style={[styles.sub, { color: colors.muted }]}>
              Thirty days of showing up. Here's a little something from Coco.
            </Text>

            <View style={[styles.codeBox, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
              <Text style={[styles.code, { color: colors.ink }]}>{code}</Text>
            </View>

            <Pressable
              style={[styles.share, { backgroundColor: colors.accent }]}
              onPress={() => Share.share({ message: `My House of Love reward code: ${code}` })}
            >
              <Text style={[styles.shareText, { color: colors.surface }]}>Share</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

let styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 22 },
  back: { fontSize: 15, marginTop: 12 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  emoji: { fontSize: 44, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '600', letterSpacing: -0.4, marginBottom: 10 },
  sub: { fontSize: 14.5, lineHeight: 21, textAlign: 'center', paddingHorizontal: 10 },
  codeBox: { borderWidth: 2, borderRadius: 16, paddingVertical: 20, paddingHorizontal: 40, marginTop: 28, borderStyle: 'dashed' },
  code: { fontSize: 26, fontWeight: '700', letterSpacing: 3 },
  share: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, marginTop: 22 },
  shareText: { fontSize: 14, fontWeight: '700' },
});