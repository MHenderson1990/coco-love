import { useEffect, useMemo } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

export default function SparkleOverlay({ width, height }) {
  let count = Math.max(14, Math.min(60, Math.round((width * height) / 1400)));

  let stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: Math.random() * Math.max(width - 16, 1),
        y: Math.random() * Math.max(height - 16, 1),
        size: 8 + Math.random() * 12,
        delay: Math.random() * 1000,
        duration: 450 + Math.random() * 500,
        color: i % 3 === 0 ? '#F5D77A' : '#ffffff',
        spin: Math.random() > 0.5 ? 1 : -1,
        anim: new Animated.Value(0),
      })),
    [count, width, height]
  );

  useEffect(() => {
    let loops = stars.map((s) => {
      let loop = Animated.loop(
        Animated.sequence([
          Animated.delay(s.delay),
          Animated.timing(s.anim, { toValue: 1, duration: s.duration, useNativeDriver: true }),
          Animated.timing(s.anim, { toValue: 0, duration: s.duration, useNativeDriver: true }),
        ])
      );
      loop.start();
      return loop;
    });
    return () => loops.forEach((l) => l.stop());
  }, [stars]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((s, i) => (
        <Animated.Text
          key={i}
          style={{
            position: 'absolute',
            left: s.x,
            top: s.y,
            fontSize: s.size,
            color: s.color,
            textShadowColor: s.color,
            textShadowRadius: 6,
            opacity: s.anim,
            transform: [
              { scale: s.anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.2] }) },
              {
                rotate: s.anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', `${s.spin * 45}deg`],
                }),
              },
            ],
          }}
        >
          ✦
        </Animated.Text>
      ))}
    </View>
  );
}