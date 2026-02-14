import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface DifficultyConfig {
  speed: number;
  criticalZone: number;
  hitZone: number;
  label: string;
}

const DIFFICULTY: Record<number, DifficultyConfig> = {
  1: { speed: 1200, criticalZone: 0.20, hitZone: 0.30, label: 'THREAT LV.1' },
  2: { speed: 900, criticalZone: 0.15, hitZone: 0.25, label: 'THREAT LV.2' },
  3: { speed: 650, criticalZone: 0.10, hitZone: 0.20, label: 'THREAT LV.3' },
};

type StrikeResult = 'critical' | 'hit' | 'weak' | 'miss';

interface AttackMinigameProps {
  visible: boolean;
  act: number;
  onComplete: (result: StrikeResult) => void;
}

const RESULT_CONFIG: Record<StrikeResult, { text: string; color: string }> = {
  critical: { text: 'CRITICAL HIT!', color: '#00FF88' },
  hit: { text: 'HIT', color: '#00E5FF' },
  weak: { text: 'WEAK STRIKE', color: '#E8A838' },
  miss: { text: 'MISS', color: '#FF2244' },
};

const BAR_WIDTH = 280;

export default function AttackMinigame({ visible, act, onComplete }: AttackMinigameProps) {
  const config = DIFFICULTY[act] || DIFFICULTY[1];

  const [struck, setStruck] = useState(false);
  const [result, setResult] = useState<StrikeResult | null>(null);
  const [gameActive, setGameActive] = useState(false);

  const markerPos = useSharedValue(0);
  const headerGlow = useSharedValue(0);
  const resultScale = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const scanLineY = useSharedValue(0);

  const criticalStart = (1 - config.criticalZone) / 2;
  const criticalEnd = criticalStart + config.criticalZone;
  const hitStart = criticalStart - config.hitZone;
  const hitEnd = criticalEnd + config.hitZone;

  useEffect(() => {
    if (visible) {
      setStruck(false);
      setResult(null);
      setGameActive(true);

      markerPos.value = 0;
      markerPos.value = withRepeat(
        withSequence(
          withTiming(1, { duration: config.speed, easing: Easing.linear }),
          withTiming(0, { duration: config.speed, easing: Easing.linear }),
        ),
        -1,
        false,
      );

      headerGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.3, { duration: 800 }),
        ),
        -1,
        true,
      );

      scanLineY.value = 0;
      scanLineY.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.linear }),
        -1,
        false,
      );

      resultScale.value = 0;
    } else {
      setGameActive(false);
      cancelAnimation(markerPos);
    }
  }, [visible, act]);

  const determineResult = useCallback((position: number): StrikeResult => {
    if (position >= criticalStart && position <= criticalEnd) return 'critical';
    if (position >= hitStart && position <= hitEnd) return 'hit';
    return 'weak';
  }, [criticalStart, criticalEnd, hitStart, hitEnd]);

  const handleStrike = useCallback(() => {
    if (!gameActive || struck) return;

    setStruck(true);
    setGameActive(false);

    const currentPos = markerPos.value;
    cancelAnimation(markerPos);

    const strikeResult = determineResult(currentPos);
    setResult(strikeResult);

    if (strikeResult === 'critical') {
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    } else if (strikeResult === 'hit') {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    } else {
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch {}
    }

    resultScale.value = withSequence(
      withTiming(1.3, { duration: 150 }),
      withTiming(1, { duration: 200 }),
    );

    buttonScale.value = withSequence(
      withTiming(0.9, { duration: 80 }),
      withTiming(1, { duration: 120 }),
    );

    setTimeout(() => onComplete(strikeResult), 1200);
  }, [gameActive, struck, markerPos, determineResult, onComplete]);

  const markerStyle = useAnimatedStyle(() => ({
    left: markerPos.value * BAR_WIDTH,
  }));

  const headerGlowStyle = useAnimatedStyle(() => ({
    opacity: headerGlow.value,
  }));

  const resultAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resultScale.value }],
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const scanStyle = useAnimatedStyle(() => ({
    top: `${scanLineY.value * 100}%`,
  }));

  const weakLeftWidth = hitStart * 100;
  const hitLeftWidth = config.hitZone * 100;
  const criticalWidth = config.criticalZone * 100;
  const hitRightWidth = config.hitZone * 100;
  const weakRightWidth = (1 - hitEnd) * 100;

  const resultInfo = result ? RESULT_CONFIG[result] : null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Animated.View style={[styles.scanLine, scanStyle]} />

          <View style={styles.header}>
            <Animated.View style={[styles.headerGlowBg, headerGlowStyle]} />
            <MaterialCommunityIcons
              name="sword-cross"
              size={18}
              color={Colors.accent.cyan}
            />
            <Text style={styles.headerTitle}>COMBAT STRIKE</Text>
            <Text style={styles.headerSub}>{config.label}</Text>
          </View>

          <Text style={styles.instruction}>
            Time your strike for maximum damage
          </Text>

          <View style={styles.barContainer}>
            <View style={styles.powerBar}>
              <View style={[styles.zone, styles.zoneWeak, { width: `${weakLeftWidth}%` }]} />
              <View style={[styles.zone, styles.zoneHit, { width: `${hitLeftWidth}%` }]} />
              <View style={[styles.zone, styles.zoneCritical, { width: `${criticalWidth}%` }]} />
              <View style={[styles.zone, styles.zoneHit, { width: `${hitRightWidth}%` }]} />
              <View style={[styles.zone, styles.zoneWeak, { width: `${weakRightWidth}%` }]} />

              <Animated.View style={[styles.marker, markerStyle]} />
            </View>

            <View style={styles.zoneLabels}>
              <Text style={styles.zoneLabelWeak}>WEAK</Text>
              <Text style={styles.zoneLabelHit}>HIT</Text>
              <Text style={styles.zoneLabelCrit}>CRIT</Text>
              <Text style={styles.zoneLabelHit}>HIT</Text>
              <Text style={styles.zoneLabelWeak}>WEAK</Text>
            </View>
          </View>

          {result && resultInfo ? (
            <Animated.View style={[styles.resultContainer, resultAnimStyle]}>
              <Text style={[styles.resultText, { color: resultInfo.color }]}>
                {resultInfo.text}
              </Text>
            </Animated.View>
          ) : (
            <Pressable onPress={handleStrike} disabled={struck} testID="strike-button">
              <Animated.View style={[styles.strikeButton, buttonAnimStyle]}>
                <MaterialCommunityIcons
                  name="lightning-bolt"
                  size={22}
                  color="#08081A"
                />
                <Text style={styles.strikeButtonText}>STRIKE</Text>
              </Animated.View>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#08081A',
    borderWidth: 1,
    borderColor: Colors.accent.cyan,
    borderRadius: 4,
    padding: 16,
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  headerGlowBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
  },
  headerTitle: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.accent.cyan,
    letterSpacing: 2,
  },
  headerSub: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: Colors.text.dim,
    marginLeft: 'auto',
    letterSpacing: 1,
  },
  instruction: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: Colors.text.dim,
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  barContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  powerBar: {
    width: BAR_WIDTH,
    height: 40,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  zone: {
    height: '100%',
  },
  zoneWeak: {
    backgroundColor: Colors.bg.tertiary,
  },
  zoneHit: {
    backgroundColor: 'rgba(0, 229, 255, 0.25)',
  },
  zoneCritical: {
    backgroundColor: 'rgba(0, 255, 136, 0.35)',
  },
  marker: {
    position: 'absolute',
    top: 0,
    width: 3,
    height: '100%',
    backgroundColor: '#FFFFFF',
    marginLeft: -1.5,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  zoneLabels: {
    width: BAR_WIDTH,
    flexDirection: 'row',
    marginTop: 6,
  },
  zoneLabelWeak: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 8,
    color: Colors.text.dim,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  zoneLabelHit: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 8,
    color: Colors.accent.cyan,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  zoneLabelCrit: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 8,
    color: Colors.accent.neon,
    textAlign: 'center',
    letterSpacing: 0.5,
    fontWeight: '700' as const,
  },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  resultText: {
    fontFamily: 'monospace',
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 255, 136, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  strikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent.cyan,
    paddingVertical: 14,
    borderRadius: 4,
    marginHorizontal: 20,
  },
  strikeButtonText: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#08081A',
    letterSpacing: 3,
  },
});
