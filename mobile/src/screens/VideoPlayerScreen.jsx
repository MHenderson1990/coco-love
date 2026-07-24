import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTheme } from '../context/ThemeContext';

export default function VideoPlayerScreen({ route, navigation }) {
  let { colors } = useTheme();
  let { videoUrl, title, description } = route.params;

  let player = useVideoPlayer(videoUrl, (p) => {
    p.play();
  });

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: colors.bg }]} edges={['top']}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={[styles.backText, { color: colors.muted }]}>‹ Back</Text>
      </Pressable>

      <VideoView
        style={styles.video}
        player={player}
        allowsFullscreen
        contentFit="contain"
      />

      <View style={styles.meta}>
        <Text style={[styles.title, { color: colors.ink }]}>{title}</Text>
        {description ? (
          <Text style={[styles.desc, { color: colors.muted }]}>{description}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

let styles = StyleSheet.create({
  wrap: { flex: 1 },
  back: { paddingHorizontal: 22, paddingVertical: 8 },
  backText: { fontSize: 15 },
  video: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  meta: { paddingHorizontal: 22, paddingTop: 20 },
  title: { fontSize: 20, fontWeight: '600', letterSpacing: -0.3 },
  desc: { fontSize: 14, lineHeight: 21, marginTop: 8 },
});