import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { Mood } from '@/lib/useGameStore';

interface GodAvatarProps {
  isThinking: boolean;
  mood: Mood;
}

const MOOD_COLORS: Record<Mood, { inner: string; outer: string; ring: string }> = {
  neutral: {
    inner: '#4A7FBF',
    outer: '#2A4A7F',
    ring: 'rgba(74, 127, 191, 0.4)',
  },
  danger: {
    inner: '#C44040',
    outer: '#8B2020',
    ring: 'rgba(196, 64, 64, 0.4)',
  },
  mystic: {
    inner: '#9B7FD4',
    outer: '#5A3D8F',
    ring: 'rgba(155, 127, 212, 0.4)',
  },
};

const SLOW_EASE = Easing.bezier(0.4, 0.0, 0.2, 1.0);
const FAST_EASE = Easing.bezier(0.4, 0.0, 0.6, 1.0);

export default function GodAvatar({ isThinking, mood }: GodAvatarProps) {
  const breathScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  const ringScale = useSharedValue(1);

  useEffect(() => {
    if (isThinking) {
      breathScale.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 300, easing: FAST_EASE }),
          withTiming(0.95, { duration: 300, easing: FAST_EASE }),
        ),
        -1,
        true,
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 250, easing: Easing.linear }),
          withTiming(0.2, { duration: 250, easing: Easing.linear }),
        ),
        -1,
        true,
      );
      ringScale.value = withRepeat(
        withSequence(
          withTiming(1.35, { duration: 600, easing: FAST_EASE }),
          withTiming(1.0, { duration: 600, easing: FAST_EASE }),
        ),
        -1,
        true,
      );
    } else {
      breathScale.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 2800, easing: SLOW_EASE }),
          withTiming(1.0, { duration: 2800, easing: SLOW_EASE }),
        ),
        -1,
        true,
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 2500, easing: Easing.linear }),
          withTiming(0.2, { duration: 2500, easing: Easing.linear }),
        ),
        -1,
        true,
      );
      ringScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 3500, easing: SLOW_EASE }),
          withTiming(1.0, { duration: 3500, easing: SLOW_EASE }),
        ),
        -1,
        true,
      );
    }
  }, [isThinking]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: glowOpacity.value * 0.6,
  }));

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value * 1.1 }],
    opacity: glowOpacity.value * 0.3,
  }));

  const moodColors = MOOD_COLORS[mood];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.outerRing, outerRingStyle]}>
        <View style={[styles.outerRingCircle, { borderColor: moodColors.ring }]} />
      </Animated.View>

      <Animated.View style={[styles.ring, ringStyle]}>
        <View style={[styles.ringCircle, { borderColor: moodColors.ring }]} />
      </Animated.View>

      <Animated.View style={[styles.glowWrap, glowStyle]}>
        <View style={[styles.glow, { backgroundColor: moodColors.inner }]} />
      </Animated.View>

      <Animated.View style={[styles.orbWrap, orbStyle]}>
        <View style={[styles.orbCore, { backgroundColor: moodColors.outer }]}>
          <View style={[styles.orbInner, { backgroundColor: moodColors.inner }]} />
          <View style={styles.orbHighlight} />
        </View>
      </Animated.View>
    </View>
  );
}

const S = 110;

const styles = StyleSheet.create({
  container: {
    width: S * 2,
    height: S * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbWrap: {
    position: 'absolute',
    width: S,
    height: S,
    borderRadius: S / 2,
  },
  orbCore: {
    width: S,
    height: S,
    borderRadius: S / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  orbInner: {
    width: S * 0.7,
    height: S * 0.7,
    borderRadius: S * 0.35,
    opacity: 0.7,
  },
  orbHighlight: {
    position: 'absolute',
    top: S * 0.18,
    left: S * 0.22,
    width: S * 0.22,
    height: S * 0.12,
    borderRadius: S * 0.08,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  glowWrap: {
    position: 'absolute',
    width: S * 1.6,
    height: S * 1.6,
    borderRadius: S * 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: '100%',
    height: '100%',
    borderRadius: S * 0.8,
    opacity: 0.12,
  },
  ring: {
    position: 'absolute',
    width: S * 1.4,
    height: S * 1.4,
    borderRadius: S * 0.7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCircle: {
    width: '100%',
    height: '100%',
    borderRadius: S * 0.7,
    borderWidth: 1.5,
  },
  outerRing: {
    position: 'absolute',
    width: S * 1.75,
    height: S * 1.75,
    borderRadius: S * 0.875,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRingCircle: {
    width: '100%',
    height: '100%',
    borderRadius: S * 0.875,
    borderWidth: 1,
  },
});
