import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';

let MILESTONE = 30;
let SIZE = 30;
let STROKE = 3.5;

export default function StreakRing({ streak }) {
  let { colors } = useTheme();

  let radius = (SIZE - STROKE) / 2;
  let circumference = 2 * Math.PI * radius;
  let progress = Math.min(streak / MILESTONE, 1);
  let offset = circumference * (1 - progress);
  let remaining = Math.max(MILESTONE - streak, 0);

  return (
    <BlurView intensity={30} tint="dark" style={styles.wrap}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2} cy={SIZE / 2} r={radius}
          stroke={colors.accentSoft} strokeWidth={STROKE} fill="none"
        />
        <Circle
          cx={SIZE / 2} cy={SIZE / 2} r={radius}
          stroke={colors.accent} strokeWidth={STROKE} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>
      <View style={styles.text}>
        <Text style={[styles.count, { color: '#fff' }]}>
          {streak} {streak === 1 ? 'day' : 'days'}
        </Text>
        <Text style={[styles.label, { color: 'rgba(255,255,255,0.75)' }]}>
          {remaining > 0 ? `${remaining} to your reward` : 'Reward unlocked'}
        </Text>
      </View>
    </BlurView>
  );
}

let styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 100, overflow: 'hidden',
    paddingVertical: 8, paddingLeft: 10, paddingRight: 16,
  },
  text: { gap: 1 },
  count: { fontSize: 13, fontWeight: '700', letterSpacing: -0.2 },
  label: { fontSize: 11 },
});