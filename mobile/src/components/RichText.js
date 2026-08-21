import { Text } from 'react-native';

let RX = /(\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*)/g;

function parseRich(input) {
  let out = [], last = 0, m;
  RX.lastIndex = 0;
  while ((m = RX.exec(input)) !== null) {
    if (m.index > last) out.push({ t: input.slice(last, m.index), s: null });
    if (m[2] != null) out.push({ t: m[2], s: 'bold' });
    else if (m[3] != null) out.push({ t: m[3], s: 'underline' });
    else if (m[4] != null) out.push({ t: m[4], s: 'italic' });
    last = RX.lastIndex;
  }
  if (last < input.length) out.push({ t: input.slice(last), s: null });
  return out;
}

export default function RichText({ text, style, fonts, numberOfLines }) {
  let runs = parseRich(text || '');
  return (
    <Text style={style} numberOfLines={numberOfLines} selectable>
      {runs.map((r, i) => {
        let s = null;
        if (r.s === 'bold') s = fonts?.bold ? { fontFamily: fonts.bold } : { fontWeight: '700' };
        else if (r.s === 'italic') s = fonts?.italic ? { fontFamily: fonts.italic } : { fontStyle: 'italic' };
        else if (r.s === 'underline') s = { textDecorationLine: 'underline' };
        return <Text key={i} style={s}>{r.t}</Text>;
      })}
    </Text>
  );
}