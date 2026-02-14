import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';

interface GlitchOverlayProps {
  hp: number;
}

export default function GlitchOverlay({ hp }: GlitchOverlayProps) {
  if (hp > 50) return null;

  const severity = hp <= 25 ? 'critical' : 'warning';

  const staticOpacity = useSharedValue(0);
  const scanlineOffset = useSharedValue(0);
  const rgbShiftX = useSharedValue(0);
  const flickerOpacity = useSharedValue(0);
  const tintOpacity = useSharedValue(0);

  useEffect(() => {
    if (severity === 'critical') {
      staticOpacity.value = withRepeat(
        withSequence(
          withTiming(0.12, { duration: 100, easing: Easing.linear }),
          withTiming(0.02, { duration: 200, easing: Easing.linear }),
          withTiming(0.15, { duration: 80, easing: Easing.linear }),
          withTiming(0.04, { duration: 300, easing: Easing.linear }),
        ),
        -1,
        true,
      );
      rgbShiftX.value = withRepeat(
        withSequence(
          withTiming(3, { duration: 100 }),
          withTiming(-2, { duration: 80 }),
          withTiming(0, { duration: 120 }),
          withTiming(4, { duration: 60 }),
          withTiming(0, { duration: 200 }),
        ),
        -1,
        false,
      );
      flickerOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 2000 }),
          withTiming(0.3, { duration: 50 }),
          withTiming(0, { duration: 50 }),
          withTiming(0, { duration: 1500 }),
          withTiming(0.15, { duration: 30 }),
          withTiming(0, { duration: 70 }),
        ),
        -1,
        false,
      );
      tintOpacity.value = withRepeat(
        withSequence(
          withTiming(0.08, { duration: 500 }),
          withTiming(0.02, { duration: 800 }),
        ),
        -1,
        true,
      );
    } else {
      staticOpacity.value = withRepeat(
        withSequence(
          withTiming(0.04, { duration: 300, easing: Easing.linear }),
          withTiming(0.01, { duration: 500, easing: Easing.linear }),
        ),
        -1,
        true,
      );
      tintOpacity.value = withRepeat(
        withSequence(
          withTiming(0.04, { duration: 800 }),
          withTiming(0.01, { duration: 1200 }),
        ),
        -1,
        true,
      );
      rgbShiftX.value = 0;
      flickerOpacity.value = 0;
    }

    scanlineOffset.value = 0;
    scanlineOffset.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.linear }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(staticOpacity);
      cancelAnimation(scanlineOffset);
      cancelAnimation(rgbShiftX);
      cancelAnimation(flickerOpacity);
      cancelAnimation(tintOpacity);
    };
  }, [severity]);

  const staticStyle = useAnimatedStyle(() => ({
    opacity: staticOpacity.value,
  }));

  const scanlineStyle = useAnimatedStyle(() => ({
    top: `${scanlineOffset.value * 100}%`,
  }));

  const rgbRedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rgbShiftX.value }],
    opacity: severity === 'critical' ? 0.06 : 0,
  }));

  const rgbCyanStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -rgbShiftX.value }],
    opacity: severity === 'critical' ? 0.04 : 0,
  }));

  const flickerStyle = useAnimatedStyle(() => ({
    opacity: flickerOpacity.value,
  }));

  const tintStyle = useAnimatedStyle(() => ({
    opacity: tintOpacity.value,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.staticNoise, staticStyle]}>
        {Array.from({ length: 12 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.staticLine,
              {
                top: `${(i / 12) * 100}%`,
                opacity: Math.random() * 0.5 + 0.2,
                height: Math.random() * 2 + 1,
              },
            ]}
          />
        ))}
      </Animated.View>

      <Animated.View style={[styles.scanline, scanlineStyle]} />

      <Animated.View style={[styles.rgbLayer, { backgroundColor: '#FF0000' }, rgbRedStyle]} />
      <Animated.View style={[styles.rgbLayer, { backgroundColor: '#00FFFF' }, rgbCyanStyle]} />

      <Animated.View style={[styles.flicker, flickerStyle]} />

      <Animated.View
        style={[
          styles.tint,
          { backgroundColor: severity === 'critical' ? '#FF2244' : '#FF8800' },
          tintStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  staticNoise: {
    ...StyleSheet.absoluteFillObject,
  },
  staticLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  rgbLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  flicker: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
  },
});
