import { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';

export default function AnimatedSplashScreen({ onFinish }) {
  let opacity = useRef(new Animated.Value(0)).current;
  let scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => onFinish?.(), 700);
    });
  }, []);

  return (
    <View style={styles.wrap}>
      <Animated.Image
        source={require('../../assets/splash-logo.png')}
        style={[styles.logo, { opacity, transform: [{ scale }] }]}
        resizeMode="contain"
      />
    </View>
  );
}

let styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#281964',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
});