import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolateColor,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
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

export default function GodAvatar({ isThinking, mood }: GodAvatarProps) {
  const breathScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  const ringScale = useSharedValue(1);
  const pulseRotation = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(breathScale);
    cancelAnimation(glowOpacity);
    cancelAnimation(ringScale);

    if (isThinking) {
      breathScale.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 300, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.95, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 250 }),
          withTiming(0.2, { duration: 250 }),
        ),
        -1,
        true,
      );
      ringScale.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 600, easing: Easing.out(Easing.ease) }),
          withTiming(1.0, { duration: 600, easing: Easing.in(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      breathScale.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 2800, easing: Easing.inOut(Easing.sine) }),
          withTiming(1.0, { duration: 2800, easing: Easing.inOut(Easing.sine) }),
        ),
        -1,
        true,
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 2500 }),
          withTiming(0.2, { duration: 2500 }),
        ),
        -1,
        true,
      );
      ringScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 3500, easing: Easing.inOut(Easing.sine) }),
          withTiming(1.0, { duration: 3500, easing: Easing.inOut(Easing.sine) }),
        ),
        -1,
        true,
      );
    }
  }, [isThinking]);

  useEffect(() => {
    pulseRotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

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
    transform: [
      { scale: ringScale.value * 1.2 },
      { rotate: `${pulseRotation.value}deg` },
    ],
    opacity: glowOpacity.value * 0.3,
  }));

  const moodColors = MOOD_COLORS[mood];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.outerRing, outerRingStyle]}>
        <View style={[styles.outerRingInner, { borderColor: moodColors.ring }]} />
      </Animated.View>

      <Animated.View style={[styles.ring, ringStyle]}>
        <View style={[styles.ringInner, { borderColor: moodColors.ring }]} />
      </Animated.View>

      <Animated.View style={[styles.glowWrap, glowStyle]}>
        <View style={[styles.glow, { backgroundColor: moodColors.inner }]} />
      </Animated.View>

      <Animated.View style={[styles.orbWrap, orbStyle]}>
        <LinearGradient
          colors={[moodColors.inner, moodColors.outer, '#0A0A0F']}
          start={{ x: 0.3, y: 0.1 }}
          end={{ x: 0.8, y: 0.9 }}
          style={styles.orb}
        />
        <View style={styles.orbHighlight} />
      </Animated.View>
    </View>
  );
}

const ORB_SIZE = 120;

const styles = StyleSheet.create({
  container: {
    width: ORB_SIZE * 2,
    height: ORB_SIZE * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbWrap: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    overflow: 'hidden',
    position: 'absolute',
  },
  orb: {
    width: '100%',
    height: '100%',
    borderRadius: ORB_SIZE / 2,
  },
  orbHighlight: {
    position: 'absolute',
    top: ORB_SIZE * 0.15,
    left: ORB_SIZE * 0.2,
    width: ORB_SIZE * 0.25,
    height: ORB_SIZE * 0.15,
    borderRadius: ORB_SIZE * 0.1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  glowWrap: {
    position: 'absolute',
    width: ORB_SIZE * 1.6,
    height: ORB_SIZE * 1.6,
    borderRadius: ORB_SIZE * 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: '100%',
    height: '100%',
    borderRadius: ORB_SIZE * 0.8,
    opacity: 0.15,
  },
  ring: {
    position: 'absolute',
    width: ORB_SIZE * 1.4,
    height: ORB_SIZE * 1.4,
    borderRadius: ORB_SIZE * 0.7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: '100%',
    height: '100%',
    borderRadius: ORB_SIZE * 0.7,
    borderWidth: 1.5,
  },
  outerRing: {
    position: 'absolute',
    width: ORB_SIZE * 1.8,
    height: ORB_SIZE * 1.8,
    borderRadius: ORB_SIZE * 0.9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRingInner: {
    width: '100%',
    height: '100%',
    borderRadius: ORB_SIZE * 0.9,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
