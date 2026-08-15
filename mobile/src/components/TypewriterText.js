import { useEffect, useRef, useState } from 'react';
import { Animated, Text } from 'react-native';

export default function TypewriterText({
  text = '',
  style,
  speed = 45,
  delay = 500,
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [done, setDone] = useState(false);
  const blink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let index = 0;
    let typingTimer;
    let startTimer;

    setDisplayedText('');
    setDone(false);

    if (!text) return undefined;

    startTimer = setTimeout(() => {
      const typeNextCharacter = () => {
        index += 1;
        setDisplayedText(text.slice(0, index));

        if (index < text.length) {
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
        Animated.timing(blink, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(blink, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [done, blink]);

  return (
  <Text style={style}>
    TEST: {displayedText}
    <Animated.Text style={{ opacity: blink }}>|</Animated.Text>
  </Text>
);
}