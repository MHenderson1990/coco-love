import { useRef } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function RevealCard({ text, revealed, onReveal, compact }) {
  let { colors } = useTheme();
  let translateY = useRef(new Animated.Value(0)).current;

  function lift() {
    Animated.timing(translateY, {
      toValue: -Dimensions.get('window').height,
      duration: 420,
      useNativeDriver: true,
    }).start(() => onReveal());
  }

  let panResponder = useRef(
    PanResponder.create({
      // claim the touch immediately so the ScrollView can't take it
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dy) > 2,
      // never give the gesture back to a parent mid-drag
      onPanResponderTerminationRequest: () => false,

      onPanResponderMove: (_, gesture) => {
        if (gesture.dy < 0) translateY.setValue(gesture.dy);
      },

      onPanResponderRelease: (_, gesture) => {
        let swipedUp = gesture.dy < -60;
        let tapped = Math.abs(gesture.dy) < 8 && Math.abs(gesture.dx) < 8;

        if (swipedUp || tapped) {
          lift();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.line },
        compact && { minHeight: 130, paddingVertical: 20 },
      ]}
    >
      <Text style={[styles.affirm, { color: colors.ink }]}>{text}</Text>

      {!revealed && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.veil,
            { backgroundColor: colors.accentSoft, transform: [{ translateY }] },
          ]}
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
    minHeight: 280, marginTop: 16, borderRadius: 22, borderWidth: 1,
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