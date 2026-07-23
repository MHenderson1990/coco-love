import { useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function RevealCard({ text, revealed, onReveal }) {
  let { colors } = useTheme();
  let translateY = useRef(new Animated.Value(0)).current;
  let [height, setHeight] = useState(300);

  let panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy < 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < -60) {
          lift();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  function lift() {
    Animated.timing(translateY, {
      toValue: -Dimensions.get('window').height,
      duration: 420,
      useNativeDriver: true,
    }).start(() => onReveal());
  }

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
    >
      <Text style={[styles.affirm, { color: colors.ink }]}>{text}</Text>

      {!revealed && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.veil,
            { backgroundColor: colors.accentSoft, transform: [{ translateY }] },
          ]}
          onTouchEnd={() => {}}
        >
          <Text style={[styles.chev, { color: colors.ink }]}>⌃</Text>
          <Text style={[styles.veilText, { color: colors.ink }]}>SWIPE UP TO REVEAL</Text>
          <View style={[styles.grip, { backgroundColor: colors.ink }]} />
        </Animated.View>
      )}
    </View>
  );
}

let styles = StyleSheet.create({
  card: {
    flex: 1, marginTop: 16, borderRadius: 22, borderWidth: 1,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, paddingVertical: 28,
  },
  affirm: { fontSize: 22, lineHeight: 31, textAlign: 'center', fontWeight: '400', letterSpacing: -0.3 },
  veil: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  chev: { fontSize: 28, opacity: 0.5, marginBottom: -8 },
  veilText: { fontSize: 11.5, fontWeight: '600', letterSpacing: 1.4, opacity: 0.62 },
  grip: { position: 'absolute', bottom: 16, width: 38, height: 4, borderRadius: 100, opacity: 0.16 },
});