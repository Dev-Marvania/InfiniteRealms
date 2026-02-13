import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { Mood } from '@/lib/useGameStore';

interface GodAvatarProps {
  isThinking: boolean;
  mood: Mood;
}

const MOOD_COLORS: Record<Mood, { glow: string; ring: string; overlay: string }> = {
  neutral: {
    glow: '#00D4FF',
    ring: 'rgba(0, 212, 255, 0.5)',
    overlay: 'rgba(0, 212, 255, 0.08)',
  },
  danger: {
    glow: '#FF2244',
    ring: 'rgba(255, 34, 68, 0.6)',
    overlay: 'rgba(255, 34, 68, 0.15)',
  },
  mystic: {
    glow: '#9B7FD4',
    ring: 'rgba(155, 127, 212, 0.5)',
    overlay: 'rgba(155, 127, 212, 0.1)',
  },
};

const EASE = Easing.bezier(0.4, 0.0, 0.2, 1.0);
const FAST_EASE = Easing.bezier(0.4, 0.0, 0.6, 1.0);

export default function GodAvatar({ isThinking, mood }: GodAvatarProps) {
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);
  const ringScale = useSharedValue(1);
  const glitchOffset = useSharedValue(0);
  const scanLine = useSharedValue(0);

  useEffect(() => {
    scanLine.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  useEffect(() => {
    if (isThinking) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 200, easing: FAST_EASE }),
          withTiming(0.96, { duration: 200, easing: FAST_EASE }),
        ),
        -1,
        true,
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 150, easing: Easing.linear }),
          withTiming(0.2, { duration: 150, easing: Easing.linear }),
        ),
        -1,
        true,
      );
      ringScale.value = withRepeat(
        withSequence(
          withTiming(1.25, { duration: 400, easing: FAST_EASE }),
          withTiming(1.0, { duration: 400, easing: FAST_EASE }),
        ),
        -1,
        true,
      );
      glitchOffset.value = withRepeat(
        withSequence(
          withTiming(3, { duration: 50, easing: Easing.linear }),
          withTiming(-2, { duration: 50, easing: Easing.linear }),
          withTiming(0, { duration: 100, easing: Easing.linear }),
          withTiming(0, { duration: 300, easing: Easing.linear }),
        ),
        -1,
        false,
      );
    } else {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 2500, easing: EASE }),
          withTiming(1.0, { duration: 2500, easing: EASE }),
        ),
        -1,
        true,
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 2000, easing: Easing.linear }),
          withTiming(0.25, { duration: 2000, easing: Easing.linear }),
        ),
        -1,
        true,
      );
      ringScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 3000, easing: EASE }),
          withTiming(1.0, { duration: 3000, easing: EASE }),
        ),
        -1,
        true,
      );
      glitchOffset.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 3000, easing: Easing.linear }),
          withTiming(2, { duration: 50, easing: Easing.linear }),
          withTiming(-1, { duration: 50, easing: Easing.linear }),
          withTiming(0, { duration: 50, easing: Easing.linear }),
        ),
        -1,
        false,
      );
    }
  }, [isThinking]);

  const moodColors = MOOD_COLORS[mood];

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: pulseScale.value },
      { translateX: glitchOffset.value },
    ],
  }));

  const outerGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value * 0.4,
    transform: [{ scale: ringScale.value * 1.15 }],
  }));

  const innerGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value * 0.5,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.outerGlow, outerGlowStyle]}>
        <View style={[styles.glowCircle, { borderColor: moodColors.ring }]} />
      </Animated.View>

      <Animated.View style={[styles.innerGlow, innerGlowStyle]}>
        <View style={[styles.glowCircle, { borderColor: moodColors.glow, borderWidth: 2 }]} />
      </Animated.View>

      <Animated.View style={[styles.imageWrap, imageStyle]}>
        <Image
          source={require('@/assets/images/architect.png')}
          style={styles.avatarImage}
          resizeMode="contain"
        />
        <Animated.View
          style={[
            styles.moodOverlay,
            { backgroundColor: moodColors.overlay },
            overlayStyle,
          ]}
        />
      </Animated.View>

      <View style={[styles.cornerTL, { borderColor: moodColors.glow }]} />
      <View style={[styles.cornerTR, { borderColor: moodColors.glow }]} />
      <View style={[styles.cornerBL, { borderColor: moodColors.glow }]} />
      <View style={[styles.cornerBR, { borderColor: moodColors.glow }]} />
    </View>
  );
}

const S = 140;
const CORNER = 14;

const styles = StyleSheet.create({
  container: {
    width: S + 30,
    height: S + 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrap: {
    width: S,
    height: S * 0.58,
    borderRadius: 4,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  moodOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 4,
  },
  outerGlow: {
    position: 'absolute',
    width: S + 24,
    height: S * 0.58 + 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerGlow: {
    position: 'absolute',
    width: S + 10,
    height: S * 0.58 + 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    borderWidth: 1,
  },
  cornerTL: {
    position: 'absolute',
    top: (S + 10 - S * 0.58) / 2 - 8,
    left: (S + 30 - S) / 2 - 8,
    width: CORNER,
    height: CORNER,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  cornerTR: {
    position: 'absolute',
    top: (S + 10 - S * 0.58) / 2 - 8,
    right: (S + 30 - S) / 2 - 8,
    width: CORNER,
    height: CORNER,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  cornerBL: {
    position: 'absolute',
    bottom: (S + 10 - S * 0.58) / 2 - 8,
    left: (S + 30 - S) / 2 - 8,
    width: CORNER,
    height: CORNER,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  cornerBR: {
    position: 'absolute',
    bottom: (S + 10 - S * 0.58) / 2 - 8,
    right: (S + 30 - S) / 2 - 8,
    width: CORNER,
    height: CORNER,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
});
