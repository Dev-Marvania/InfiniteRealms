import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

interface TraceMeterProps {
  traceLevel: number;
}

export default function TraceMeter({ traceLevel }: TraceMeterProps) {
  const widthAnim = useSharedValue(traceLevel / 100);
  const pulseOpacity = useSharedValue(0);
  const iconPulse = useSharedValue(1);

  useEffect(() => {
    widthAnim.value = withTiming(traceLevel / 100, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });

    if (traceLevel >= 75) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 300 }),
          withTiming(0, { duration: 300 }),
        ),
        -1,
        true,
      );
      iconPulse.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 400 }),
          withTiming(1, { duration: 400 }),
        ),
        -1,
        true,
      );
    } else {
      pulseOpacity.value = withTiming(0, { duration: 200 });
      iconPulse.value = withTiming(1, { duration: 200 });
    }
  }, [traceLevel]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${widthAnim.value * 100}%`,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconPulse.value }],
  }));

  const fillColor =
    traceLevel >= 75
      ? Colors.accent.danger
      : traceLevel >= 50
      ? '#FF8800'
      : '#FFB020';

  const trackColor =
    traceLevel >= 75
      ? 'rgba(255, 34, 68, 0.15)'
      : 'rgba(255, 176, 32, 0.1)';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <Animated.View style={iconStyle}>
            <MaterialCommunityIcons
              name="radar"
              size={11}
              color={fillColor}
            />
          </Animated.View>
          <Text style={[styles.label, { color: fillColor }]}>TRACE</Text>
        </View>
        <Text style={[styles.value, { color: fillColor }]}>
          {Math.round(traceLevel)}%
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View
          style={[styles.fill, { backgroundColor: fillColor }, fillStyle]}
        />
        <Animated.View
          style={[
            styles.pulse,
            { backgroundColor: fillColor },
            pulseStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '600' as const,
  },
  track: {
    height: 6,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  pulse: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 2,
  },
});
