import { useEffect, useState } from 'react';
import { Text } from 'react-native';

export default function TypewriterText({
  text = '',
  style,
  speed = 45,
  delay = 500,
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [cursorOn, setCursorOn] = useState(true);

  useEffect(() => {
    let index = 0;
    let typingTimer;
    let startTimer;

    setDisplayedText('');
    setStarted(false);
    setDone(false);

    if (!text) return undefined;

    startTimer = setTimeout(() => {
      setStarted(true);
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
    if (!started || done) return undefined;
    setCursorOn(true);
    let id = setInterval(() => setCursorOn((on) => !on), 500);
    return () => clearInterval(id);
  }, [started, done]);

  let showCursor = started && !done && cursorOn;

  return (
    <Text style={style}>
      {displayedText}
      <Text style={{ color: showCursor ? undefined : '#00000001' }}>|</Text>
    </Text>
  );
}