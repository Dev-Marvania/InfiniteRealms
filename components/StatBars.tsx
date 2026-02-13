import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

interface StatBarProps {
  value: number;
  max: number;
  label: string;
  fillColor: string;
  trackColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}

function StatBar({ value, max, label, fillColor, trackColor, icon, iconColor }: StatBarProps) {
  const widthAnim = useSharedValue(value / max);

  useEffect(() => {
    widthAnim.value = withTiming(value / max, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, max]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${widthAnim.value * 100}%`,
  }));

  return (
    <View style={styles.barContainer}>
      <View style={styles.barHeader}>
        <View style={styles.barLabelRow}>
          <Ionicons name={icon} size={12} color={iconColor} />
          <Text style={styles.barLabel}>{label}</Text>
        </View>
        <Text style={[styles.barValue, { color: iconColor }]}>
          {value}/{max}
        </Text>
      </View>
      <View style={[styles.barTrack, { backgroundColor: trackColor }]}>
        <Animated.View
          style={[styles.barFill, { backgroundColor: fillColor }, fillStyle]}
        />
      </View>
    </View>
  );
}

interface StatBarsProps {
  hp: number;
  mana: number;
}

export default function StatBars({ hp, mana }: StatBarsProps) {
  return (
    <View style={styles.container}>
      <StatBar
        value={hp}
        max={100}
        label="HP"
        fillColor={Colors.hp.fill}
        trackColor={Colors.hp.bar}
        icon="heart"
        iconColor={Colors.hp.fill}
      />
      <StatBar
        value={mana}
        max={100}
        label="MANA"
        fillColor={Colors.mana.fill}
        trackColor={Colors.mana.bar}
        icon="diamond"
        iconColor={Colors.mana.fill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  barContainer: {
    gap: 4,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.text.secondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  barValue: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});
