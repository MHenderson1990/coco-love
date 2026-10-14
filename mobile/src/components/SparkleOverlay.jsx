import { useEffect, useMemo } from 'react';
import { Animated, Easing, View, StyleSheet } from 'react-native';

let LAYERS = 10; // more layers = less in sync
let BAND = 22; // height of the speck band on each text line
let DENSITY = 30; // px² per speck, lower = denser
let DRIFT_X = 9; // max sideways wander (px)
let DRIFT_Y = 5; // max up/down wander (px)

function rand(a, b) {
  return a + Math.random() * (b - a);
}

// slow, eased wandering between random points, no fixed back-and-forth
function wander(value, range, steps, minMs, maxMs) {
  let seq = [];
  for (let i = 0; i < steps; i++) {
    seq.push(
      Animated.timing(value, {
        toValue: rand(-range, range),
        duration: rand(minMs, maxMs),
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    );
  }
  return Animated.loop(Animated.sequence(seq));
}

function twinkle(value) {
  let seq = [];
  for (let i = 0; i < 4; i++) {
    seq.push(
      Animated.timing(value, {
        toValue: i % 2 ? rand(0.75, 1) : rand(0.1, 0.4),
        duration: rand(350, 900),
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    );
  }
  return Animated.loop(Animated.sequence(seq));
}

export default function SparkleOverlay({ width, height, lineHeight = 35 }) {
  let layers = useMemo(() => {
    let out = Array.from({ length: LAYERS }, () => ({
      specks: [],
      tx: new Animated.Value(0),
      ty: new Animated.Value(0),
      fade: new Animated.Value(rand(0.2, 0.9)),
    }));
    let rows = Math.max(1, Math.round(height / lineHeight));

    for (let r = 0; r < rows; r++) {
      let cy = r * lineHeight + lineHeight / 2;
      let x = 6 + Math.random() * 10;
      while (x < width - 10) {
        let segW = Math.min(28 + Math.random() * 60, width - 10 - x);
        let n = Math.round((segW * BAND) / DENSITY);
        for (let i = 0; i < n; i++) {
          out[Math.floor(Math.random() * LAYERS)].specks.push({
            x: x + Math.random() * segW,
            y: cy - BAND / 2 + Math.random() * BAND,
            size: 1.2 + Math.random() * 1.2,
            opacity: 0.55 + Math.random() * 0.45,
            color: Math.random() > 0.2 ? '#ffffff' : '#d9d9e8',
          });
        }
        x += segW + 8 + Math.random() * 10;
      }
    }
    return out;
  }, [width, height, lineHeight]);

  useEffect(() => {
    let anims = [];
    layers.forEach((l) => {
      anims.push(wander(l.tx, DRIFT_X, 4, 900, 2200));
      anims.push(wander(l.ty, DRIFT_Y, 3, 1100, 2600));
      anims.push(twinkle(l.fade));
    });
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [layers]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {layers.map((l, li) => (
        <Animated.View
          key={li}
          style={[
            StyleSheet.absoluteFill,
            { opacity: l.fade, transform: [{ translateX: l.tx }, { translateY: l.ty }] },
          ]}
        >
          {l.specks.map((s, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: s.x,
                top: s.y,
                width: s.size,
                height: s.size,
                borderRadius: s.size / 2,
                backgroundColor: s.color,
                opacity: s.opacity,
              }}
            />
          ))}
        </Animated.View>
      ))}
    </View>
  );
}