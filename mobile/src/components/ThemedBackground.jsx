import { View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ThemedBackground({ children }) {
  let { colors, background } = useTheme();
  let bg = colors.bg;
  if (background === 'gradient') bg = colors.accentSoft;
  if (background === 'glow') bg = colors.accent;
  if (background === 'veil') bg = colors.surface;
  return <View style={{ flex: 1, backgroundColor: bg }}>{children}</View>;
}