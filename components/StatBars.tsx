import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

interface StatBarProps {
  value: number;
  max: number;
  label: string;
  fillColor: string;
  trackColor: string;
  iconName: string;
  iconSet: 'ion' | 'mci';
  iconColor: string;
}

function StatBar({ value, max, label, fillColor, trackColor, iconName, iconSet, iconColor }: StatBarProps) {
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

  const pct = Math.round((value / max) * 100);

  return (
    <View style={styles.barContainer}>
      <View style={styles.barHeader}>
        <View style={styles.barLabelRow}>
          {iconSet === 'ion' ? (
            <Ionicons name={iconName as any} size={11} color={iconColor} />
          ) : (
            <MaterialCommunityIcons name={iconName as any} size={11} color={iconColor} />
          )}
          <Text style={[styles.barLabel, { color: iconColor }]}>{label}</Text>
        </View>
        <Text style={[styles.barValue, { color: iconColor }]}>
          {pct}%
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
        label="SYS_STABILITY"
        fillColor={Colors.hp.fill}
        trackColor={Colors.hp.bar}
        iconName="alert-circle"
        iconSet="ion"
        iconColor={Colors.hp.fill}
      />
      <StatBar
        value={mana}
        max={100}
        label="ENERGY"
        fillColor={Colors.mana.fill}
        trackColor={Colors.mana.bar}
        iconName="flash"
        iconSet="ion"
        iconColor={Colors.mana.fill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  barContainer: {
    gap: 3,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  barLabel: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  barValue: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '600' as const,
  },
  barTrack: {
    height: 6,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
});
