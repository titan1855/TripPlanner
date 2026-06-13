import React, { useEffect, useRef } from 'react';
import { Animated, Platform, type ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  /** 進場延遲（毫秒），列表可依 index 做交錯 */
  delay?: number;
  style?: ViewStyle;
}

/** 進場淡入 + 輕微上移。web 不用 native driver。 */
export function FadeIn({ children, delay = 0, style }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        delay,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        delay,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [opacity, translateY, delay]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}
