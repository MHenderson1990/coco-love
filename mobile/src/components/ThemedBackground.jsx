import { View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ThemedBackground({ children }) {
  let { colors } = useTheme();
  return <View style={{ flex: 1, backgroundColor: colors.bg }}>{children}</View>;
}