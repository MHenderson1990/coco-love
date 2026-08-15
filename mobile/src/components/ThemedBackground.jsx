import { ImageBackground, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ThemedBackground({ children }) {
  let { colors, background } = useTheme();

  // paper texture is the base for the whole app
  return (
    <ImageBackground
      source={require('../../assets/paper-bg.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      {children}
    </ImageBackground>
  );
}