import { useEffect, useRef, useState } from 'react';
import { Animated, Text } from 'react-native';
import { parseRich } from './RichText';

export default function RichTypewriterText({
  text = '',
  style,
  fonts,
  speed = 45,
  delay = 500,
}) {
  let [visibleCount, setVisibleCount] = useState(0);
  let [done, setDone] = useState(false);
  let blink = useRef(new Animated.Value(1)).current;

  let runs = parseRich(text || '');
  let totalLength = runs.reduce((sum, r) => sum + r.t.length, 0);

  useEffect(() => {
    let index = 0;
    let typingTimer;
    let startTimer;

    setVisibleCount(0);
    setDone(false);

    if (!text) return undefined;

    startTimer = setTimeout(() => {
      const typeNextCharacter = () => {
        index += 1;
        setVisibleCount(index);

        if (index < totalLength) {
          typingTimer = setTimeout(typeNextCharacter, speed);
        } else {
          setDone(true);
        }
      };

      typeNextCharacter();
    }, delay);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(typingTimer);
    };
  }, [text, speed, delay]);

  useEffect(() => {
    blink.stopAnimation();

    if (done) {
      Animated.timing(blink, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start();
      return undefined;
    }

    blink.setValue(1);

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [done, blink]);

  // walk runs, truncating whichever run the cursor currently sits inside
  let remaining = visibleCount;
  let visibleRuns = [];
  for (let r of runs) {
    if (remaining <= 0) break;
    let take = Math.min(remaining, r.t.length);
    visibleRuns.push({ t: r.t.slice(0, take), s: r.s });
    remaining -= take;
  }

  return (
    <Text style={style}>
      {visibleRuns.map((r, i) => {
        let s = null;
        if (r.s === 'bold') s = fonts?.bold ? { fontFamily: fonts.bold } : { fontWeight: '700' };
        else if (r.s === 'italic') s = fonts?.italic ? { fontFamily: fonts.italic } : { fontStyle: 'italic' };
        else if (r.s === 'underline') s = { textDecorationLine: 'underline' };
        return <Text key={i} style={s}>{r.t}</Text>;
      })}
      <Animated.Text style={{ opacity: blink }}>|</Animated.Text>
    </Text>
  );
}