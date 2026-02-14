import React, { useEffect, useRef, useCallback, useState } from 'react';
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
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

const NODE_COLORS = ['#00E5FF', '#00FF88', '#9B7FD4', '#FF2244'] as const;
const NODE_ICONS: Array<keyof typeof MaterialCommunityIcons.glyphMap> = [
  'memory',
  'chip',
  'database',
  'console',
];

interface DifficultyConfig {
  steps: number;
  timeSeconds: number;
  flashDuration: number;
}

const DIFFICULTY: Record<number, DifficultyConfig> = {
  1: { steps: 3, timeSeconds: 12, flashDuration: 600 },
  2: { steps: 5, timeSeconds: 10, flashDuration: 450 },
  3: { steps: 7, timeSeconds: 9, flashDuration: 350 },
};

interface RestMinigameProps {
  visible: boolean;
  act: number;
  onComplete: (success: boolean) => void;
}

function MemoryNode({
  index,
  flashing,
  onPress,
  disabled,
  pressError,
}: {
  index: number;
  flashing: boolean;
  onPress: () => void;
  disabled: boolean;
  pressError: boolean;
}) {
  const glowOpacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const baseColor = NODE_COLORS[index];
  const icon = NODE_ICONS[index];

  useEffect(() => {
    if (flashing) {
      glowOpacity.value = withSequence(
        withTiming(1, { duration: 120 }),
        withTiming(0.8, { duration: 200 }),
      );
      scale.value = withSequence(
        withTiming(1.08, { duration: 120 }),
        withTiming(1, { duration: 200 }),
      );
    } else {
      glowOpacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(1, { duration: 150 });
    }
  }, [flashing]);

  useEffect(() => {
    if (pressError) {
      scale.value = withSequence(
        withTiming(0.85, { duration: 60 }),
        withTiming(1.1, { duration: 60 }),
        withTiming(0.9, { duration: 60 }),
        withTiming(1, { duration: 60 }),
      );
    }
  }, [pressError]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={styles.nodeWrapper}
    >
      <Animated.View
        style={[
          styles.node,
          { borderColor: baseColor },
          animStyle,
        ]}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: baseColor, borderRadius: 6 },
            glowStyle,
          ]}
        />
        <MaterialCommunityIcons
          name={icon}
          size={32}
          color={flashing ? '#FFFFFF' : baseColor}
          style={{ zIndex: 1 }}
        />
      </Animated.View>
    </Pressable>
  );
}

export default function RestMinigame({ visible, act, onComplete }: RestMinigameProps) {
  const config = DIFFICULTY[act] || DIFFICULTY[1];
  const [phase, setPhase] = useState<'observe' | 'input'>('observe');
  const [sequence, setSequence] = useState<number[]>([]);
  const [flashingNode, setFlashingNode] = useState<number | null>(null);
  const [inputIndex, setInputIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.timeSeconds);
  const [gameActive, setGameActive] = useState(false);
  const [errorNode, setErrorNode] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const observeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const timerBarWidth = useSharedValue(1);
  const scanLineY = useSharedValue(0);
  const headerGlow = useSharedValue(0);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (observeRef.current) clearTimeout(observeRef.current);
    timerRef.current = null;
    observeRef.current = null;
  }, []);

  useEffect(() => {
    if (visible) {
      const cfg = DIFFICULTY[act] || DIFFICULTY[1];
      const seq: number[] = [];
      for (let i = 0; i < cfg.steps; i++) {
        seq.push(Math.floor(Math.random() * 4));
      }
      setSequence(seq);
      setPhase('observe');
      setInputIndex(0);
      setTimeLeft(cfg.timeSeconds);
      setGameActive(false);
      setFlashingNode(null);
      setErrorNode(null);
      timerBarWidth.value = 1;

      scanLineY.value = 0;
      scanLineY.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.linear }),
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

      let step = 0;
      const playNext = () => {
        if (step < seq.length) {
          setFlashingNode(seq[step]);
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch {}
          observeRef.current = setTimeout(() => {
            setFlashingNode(null);
            step++;
            observeRef.current = setTimeout(playNext, 200);
          }, cfg.flashDuration);
        } else {
          setPhase('input');
          setGameActive(true);
          timerBarWidth.value = withTiming(0, {
            duration: cfg.timeSeconds * 1000,
            easing: Easing.linear,
          });
        }
      };

      observeRef.current = setTimeout(playNext, 600);
    } else {
      setGameActive(false);
      clearTimers();
    }

    return () => clearTimers();
  }, [visible, act]);

  useEffect(() => {
    if (gameActive && phase === 'input' && visible) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setGameActive(false);
            onComplete(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [gameActive, phase, visible]);

  const handleNodePress = useCallback(
    (nodeIndex: number) => {
      if (!gameActive || phase !== 'input') return;

      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}

      if (sequence[inputIndex] === nodeIndex) {
        const nextIndex = inputIndex + 1;
        setInputIndex(nextIndex);

        setFlashingNode(nodeIndex);
        setTimeout(() => setFlashingNode(null), 150);

        if (nextIndex >= sequence.length) {
          setGameActive(false);
          if (timerRef.current) clearInterval(timerRef.current);
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {}
          setTimeout(() => onComplete(true), 400);
        }
      } else {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch {}
        setErrorNode(nodeIndex);
        setGameActive(false);
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeout(() => {
          setErrorNode(null);
          onComplete(false);
        }, 500);
      }
    },
    [gameActive, phase, sequence, inputIndex, onComplete],
  );

  const timerStyle = useAnimatedStyle(() => ({
    width: `${timerBarWidth.value * 100}%`,
  }));

  const scanStyle = useAnimatedStyle(() => ({
    top: `${scanLineY.value * 100}%`,
  }));

  const headerGlowStyle = useAnimatedStyle(() => ({
    opacity: headerGlow.value,
  }));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Animated.View style={[styles.scanLine, scanStyle]} />

          <View style={styles.header}>
            <Animated.View style={[styles.headerGlowBg, headerGlowStyle]} />
            <MaterialCommunityIcons
              name="brain"
              size={18}
              color={Colors.accent.cyan}
            />
            <Text style={styles.headerTitle}>MEMORY REBOOT</Text>
            <Text style={styles.headerSub}>
              {phase === 'observe' ? 'OBSERVE...' : 'INPUT SEQUENCE'}
            </Text>
          </View>

          {phase === 'input' && (
            <View style={styles.timerContainer}>
              <View style={styles.timerTrack}>
                <Animated.View
                  style={[
                    styles.timerFill,
                    timerStyle,
                    timeLeft <= 3 && { backgroundColor: Colors.accent.danger },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.timerText,
                  timeLeft <= 3 && { color: Colors.accent.danger },
                ]}
              >
                {timeLeft}s
              </Text>
            </View>
          )}

          <Text style={styles.instruction}>
            {phase === 'observe'
              ? 'Watch the sequence carefully...'
              : `${inputIndex}/${sequence.length} NODES`}
          </Text>

          <View style={styles.grid}>
            <View style={styles.gridRow}>
              <MemoryNode
                index={0}
                flashing={flashingNode === 0}
                onPress={() => handleNodePress(0)}
                disabled={phase !== 'input' || !gameActive}
                pressError={errorNode === 0}
              />
              <MemoryNode
                index={1}
                flashing={flashingNode === 1}
                onPress={() => handleNodePress(1)}
                disabled={phase !== 'input' || !gameActive}
                pressError={errorNode === 1}
              />
            </View>
            <View style={styles.gridRow}>
              <MemoryNode
                index={2}
                flashing={flashingNode === 2}
                onPress={() => handleNodePress(2)}
                disabled={phase !== 'input' || !gameActive}
                pressError={errorNode === 2}
              />
              <MemoryNode
                index={3}
                flashing={flashingNode === 3}
                onPress={() => handleNodePress(3)}
                disabled={phase !== 'input' || !gameActive}
                pressError={errorNode === 3}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.phaseLabel}>
              {phase === 'observe'
                ? `SEQUENCE LENGTH: ${sequence.length}`
                : `${inputIndex}/${sequence.length} COMPLETE`}
            </Text>
          </View>
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
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  timerTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.bg.tertiary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    backgroundColor: Colors.accent.cyan,
    borderRadius: 2,
  },
  timerText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.accent.cyan,
    width: 28,
    textAlign: 'right',
  },
  instruction: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: Colors.text.dim,
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  grid: {
    alignItems: 'center',
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  nodeWrapper: {
    width: 100,
    height: 100,
  },
  node: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 8,
    backgroundColor: Colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  footer: {
    marginTop: 14,
    alignItems: 'center',
  },
  phaseLabel: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.accent.neon,
    letterSpacing: 1.5,
    fontWeight: '600' as const,
  },
});
