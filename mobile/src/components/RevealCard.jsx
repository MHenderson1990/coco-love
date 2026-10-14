import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Pressable } from 'react-native';
import RichText from './RichText';
import SparkleOverlay from './SparkleOverlay';

export default function RevealCard({ text, revealed, onReveal, compact, onAffirmationDone }) {
  let [textSize, setTextSize] = useState({ w: 0, h: 0 });
  let [sparkling, setSparkling] = useState(true);
  let textFade = useRef(new Animated.Value(0)).current;
  let sparkFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!revealed) {
      textFade.setValue(0);
      sparkFade.setValue(1);
      setSparkling(true);
      return undefined;
    }
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
    return undefined;
  }, [revealed]);

  return (
    <Pressable
      disabled={revealed}
      onPress={onReveal}
      accessibilityRole="button"
      accessibilityLabel="Tap to reveal today's message"
      style={[styles.card, compact && { minHeight: 130, paddingVertical: 20 }]}
    >
      <View
        style={{ alignSelf: 'stretch' }}
        onLayout={(e) =>
          setTextSize({
            w: e.nativeEvent.layout.width,
            h: e.nativeEvent.layout.height,
          })
        }
      >
        <Animated.View
          style={{ opacity: textFade }}
          pointerEvents={revealed ? 'auto' : 'none'}
        >
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
    </Pressable>
  );
}

let styles = StyleSheet.create({
  card: {
    minHeight: 280, marginTop: 0, borderRadius: 22,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-start',
    paddingHorizontal: 24, paddingVertical: 28,
  },
  affirm: { fontSize: 20, lineHeight: 35, textAlign: 'center', fontFamily: 'PlaywriteGBS_400Regular' },
});