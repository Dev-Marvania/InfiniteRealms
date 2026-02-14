import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { EnemyState } from '@/lib/useGameStore';

interface EnemyBarProps {
  enemy: EnemyState;
}

const ACT_COLORS: Record<number, string> = {
  1: '#8090A8',
  2: '#FF2244',
  3: '#FF00FF',
};

const ACT_ICONS: Record<number, string> = {
  1: 'bug-outline',
  2: 'robot-angry-outline',
  3: 'skull-crossbones-outline',
};

export default function EnemyBar({ enemy }: EnemyBarProps) {
  const hpPercent = Math.max(0, enemy.hp / enemy.maxHp);
  const color = ACT_COLORS[enemy.act] || '#FF2244';
  const icon = ACT_ICONS[enemy.act] || 'robot-angry-outline';

  const shakeX = useSharedValue(0);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const barWidth = useAnimatedStyle(() => ({
    width: withTiming(`${hpPercent * 100}%`, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    }),
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.header}>
        <MaterialCommunityIcons name={icon as any} size={14} color={color} />
        <Text style={[styles.name, { color }]} numberOfLines={1}>{enemy.name}</Text>
        <Text style={styles.hpText}>{enemy.hp}/{enemy.maxHp}</Text>
      </View>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { backgroundColor: color }, barWidth]} />
      </View>
      <Text style={styles.label}>HOSTILE DETECTED</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 34, 68, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 34, 68, 0.2)',
    borderRadius: 4,
    padding: 8,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700' as const,
    flex: 1,
    letterSpacing: 1,
  },
  hpText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: Colors.text.dim,
  },
  barTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: Colors.text.dim,
    letterSpacing: 2,
    textAlign: 'center',
    opacity: 0.5,
  },
});
