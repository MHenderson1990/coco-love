import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, PanResponder, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import RichText from './RichText';
import SparkleOverlay from './SparkleOverlay';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';

export default function RevealCard({ text, revealed, onReveal, compact, onAffirmationDone }) {
  let { colors } = useTheme();
  let translateY = useRef(new Animated.Value(0)).current;
  let [textSize, setTextSize] = useState({ w: 0, h: 0 });
  let [sparkling, setSparkling] = useState(false);
  let textFade = useRef(new Animated.Value(0)).current;
  let sparkFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!revealed) {
      textFade.setValue(0);
      sparkFade.setValue(0);
      setSparkling(false);
      return undefined;
    }
    setSparkling(true);
    Animated.timing(sparkFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    let t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(textFade, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sparkFade, {
          toValue: 0,
          duration: 3400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setSparkling(false);
        onAffirmationDone?.();
      });
    }, 1500);

    return () => clearTimeout(t);
  }, [revealed]);

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
      {revealed && (
        <View
          style={{ alignSelf: 'stretch' }}
          onLayout={(e) =>
            setTextSize({
              w: e.nativeEvent.layout.width,
              h: e.nativeEvent.layout.height,
            })
          }
        >
          <Animated.View style={{ opacity: textFade }}>
            <RichText
              key={text}
              text={text}
              style={[styles.affirm, { color: '#fff' }]}
            />
          </Animated.View>
          {sparkling && textSize.w > 0 && (
            <Animated.View
              style={[StyleSheet.absoluteFill, { opacity: sparkFade }]}
              pointerEvents="none"
            >
              <SparkleOverlay width={textSize.w} height={textSize.h} />
            </Animated.View>
          )}
        </View>
      )}

      {!revealed && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.veil, { transform: [{ translateY }] }]}
        >
          <BlurView
            intensity={40}
            tint="dark"
            style={[styles.veilBlur, Platform.OS === 'android' && { backgroundColor: 'rgba(0,0,0,0.55)' }]}
          >
            <Text style={[styles.chev, { color: '#fff' }]}>⌃</Text>
            <Text style={[styles.veilText, { color: '#fff' }]}>SWIPE UP TO REVEAL</Text>
            <View style={[styles.grip, { backgroundColor: '#fff' }]} />
          </BlurView>
        </Animated.View>
      )}
    </View>
  );
}

let styles = StyleSheet.create({
  card: {
    minHeight: 280, marginTop: 0, borderRadius: 22,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-start',
    paddingHorizontal: 24, paddingVertical: 28,
  },
  affirm: { fontSize: 20, lineHeight: 35, textAlign: 'center', fontFamily: 'PlaywriteGBS_400Regular' },
  veil: { ...StyleSheet.absoluteFillObject, borderRadius: 22, overflow: 'hidden' },
  veilBlur: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  chev: { fontSize: 28, opacity: 0.5, marginBottom: -8 },
  veilText: { fontSize: 11.5, fontWeight: '600', letterSpacing: 1.4, opacity: 0.62 },
  grip: { position: 'absolute', bottom: 16, width: 38, height: 4, borderRadius: 100, opacity: 0.16 },
});