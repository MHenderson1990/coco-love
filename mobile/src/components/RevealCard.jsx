import { useRef } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions, ImageBackground } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import RichText from './RichText';

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
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dy) > 2,
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
    <View style={[styles.card, compact && { minHeight: 130, paddingVertical: 20 }]}>
      <RichText
        text={text}
        style={[styles.affirm, { color: '#1A1A1A' }]}
      />

      {!revealed && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.veil, { transform: [{ translateY }] }]}
        >
          <ImageBackground
            source={require('../../assets/paper-bg.jpg')}
            style={styles.veilPaper}
            resizeMode="cover"
          >
            <Text style={[styles.chev, { color: '#5A5A5A' }]}>⌃</Text>
            <Text style={[styles.veilText, { color: '#5A5A5A' }]}>SWIPE UP TO REVEAL</Text>
            <View style={[styles.grip, { backgroundColor: '#9A9A9A' }]} />
          </ImageBackground>
        </Animated.View>
      )}
    </View>
  );
}

let styles = StyleSheet.create({
  card: {
    minHeight: 280, marginTop: 16, borderRadius: 22,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, paddingVertical: 28,
  },
  affirm: { fontSize: 26, lineHeight: 35, textAlign: 'center', fontFamily: 'PlaywriteGBS_400Regular' },
  veil: { ...StyleSheet.absoluteFillObject },
  veilPaper: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', gap: 12 },
  chev: { fontSize: 28, opacity: 0.5, marginBottom: -8 },
  veilText: { fontSize: 11.5, fontWeight: '600', letterSpacing: 1.4, opacity: 0.62 },
  grip: { position: 'absolute', bottom: 16, width: 38, height: 4, borderRadius: 100, opacity: 0.16 },
});