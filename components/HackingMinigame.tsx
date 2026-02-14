import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

const HEX_CHARS = '0123456789ABCDEF';

function randomHex(len: number): string {
  let r = '';
  for (let i = 0; i < len; i++) {
    r += HEX_CHARS[Math.floor(Math.random() * 16)];
  }
  return r;
}

interface HexCell {
  id: string;
  code: string;
  pairId: string;
  matched: boolean;
}

function generateGrid(pairCount: number): HexCell[] {
  const pairs: HexCell[] = [];
  for (let i = 0; i < pairCount; i++) {
    const code = randomHex(4);
    const pairId = `pair-${i}`;
    pairs.push(
      { id: `a-${i}`, code, pairId, matched: false },
      { id: `b-${i}`, code, pairId, matched: false },
    );
  }
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs;
}

interface DifficultyConfig {
  pairs: number;
  timeSeconds: number;
  label: string;
}

const DIFFICULTY: Record<number, DifficultyConfig> = {
  1: { pairs: 4, timeSeconds: 15, label: 'FIREWALL v1.0' },
  2: { pairs: 6, timeSeconds: 12, label: 'FIREWALL v2.5' },
  3: { pairs: 8, timeSeconds: 10, label: 'FIREWALL v4.0' },
};

interface HackingMinigameProps {
  visible: boolean;
  act: number;
  onComplete: (success: boolean) => void;
}

function HexCellButton({
  cell,
  selected,
  wrong,
  onPress,
  disabled,
}: {
  cell: HexCell;
  selected: boolean;
  wrong: boolean;
  onPress: () => void;
  disabled: boolean;
}) {
  const scale = useSharedValue(1);
  const bgOpacity = useSharedValue(0);

  useEffect(() => {
    if (cell.matched) {
      scale.value = withSequence(
        withTiming(1.15, { duration: 100 }),
        withTiming(1, { duration: 150 }),
      );
      bgOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [cell.matched]);

  useEffect(() => {
    if (wrong) {
      scale.value = withSequence(
        withTiming(0.9, { duration: 80 }),
        withTiming(1.05, { duration: 80 }),
        withTiming(1, { duration: 80 }),
      );
    }
  }, [wrong]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const matchedBg = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  const borderColor = cell.matched
    ? Colors.accent.neon
    : wrong
    ? Colors.accent.danger
    : selected
    ? Colors.accent.cyan
    : Colors.border.subtle;

  const textColor = cell.matched
    ? Colors.accent.neon
    : wrong
    ? Colors.accent.danger
    : selected
    ? Colors.accent.cyan
    : Colors.text.secondary;

  return (
    <Pressable onPress={onPress} disabled={disabled || cell.matched}>
      <Animated.View
        style={[styles.hexCell, { borderColor }, animStyle]}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(0, 255, 136, 0.08)' },
            matchedBg,
          ]}
        />
        <Text style={[styles.hexCode, { color: textColor }]}>
          {cell.matched ? cell.code : selected || wrong ? cell.code : '????'}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function HackingMinigame({ visible, act, onComplete }: HackingMinigameProps) {
  const config = DIFFICULTY[act] || DIFFICULTY[1];
  const [grid, setGrid] = useState<HexCell[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [wrongPair, setWrongPair] = useState<[string, string] | null>(null);
  const [timeLeft, setTimeLeft] = useState(config.timeSeconds);
  const [gameActive, setGameActive] = useState(false);
  const [matchedCount, setMatchedCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const timerBarWidth = useSharedValue(1);
  const scanLineY = useSharedValue(0);
  const headerGlow = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      const newConfig = DIFFICULTY[act] || DIFFICULTY[1];
      const newGrid = generateGrid(newConfig.pairs);
      setGrid(newGrid);
      setSelected(null);
      setWrongPair(null);
      setTimeLeft(newConfig.timeSeconds);
      setMatchedCount(0);
      setGameActive(true);
      timerBarWidth.value = 1;
      timerBarWidth.value = withTiming(0, {
        duration: newConfig.timeSeconds * 1000,
        easing: Easing.linear,
      });
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
    } else {
      setGameActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [visible, act]);

  useEffect(() => {
    if (gameActive && visible) {
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
  }, [gameActive, visible]);

  const handleCellPress = useCallback(
    (cellId: string) => {
      if (!gameActive) return;

      const cell = grid.find((c) => c.id === cellId);
      if (!cell || cell.matched) return;

      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}

      if (!selected) {
        setSelected(cellId);
        return;
      }

      if (selected === cellId) {
        setSelected(null);
        return;
      }

      const first = grid.find((c) => c.id === selected);
      if (!first) {
        setSelected(cellId);
        return;
      }

      if (first.pairId === cell.pairId) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
        const newGrid = grid.map((c) =>
          c.pairId === cell.pairId ? { ...c, matched: true } : c,
        );
        setGrid(newGrid);
        setSelected(null);
        const newMatched = matchedCount + 1;
        setMatchedCount(newMatched);

        const totalPairs = (DIFFICULTY[act] || DIFFICULTY[1]).pairs;
        if (newMatched >= totalPairs) {
          setGameActive(false);
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeout(() => onComplete(true), 400);
        }
      } else {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch {}
        setWrongPair([selected, cellId]);
        setSelected(null);
        setTimeout(() => setWrongPair(null), 500);
      }
    },
    [grid, selected, gameActive, matchedCount, act, onComplete],
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

  const cols = act === 3 ? 4 : act === 2 ? 4 : 4;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Animated.View
            style={[styles.scanLine, scanStyle]}
          />

          <View style={styles.header}>
            <Animated.View style={[styles.headerGlowBg, headerGlowStyle]} />
            <MaterialCommunityIcons
              name="shield-lock-outline"
              size={18}
              color={Colors.accent.cyan}
            />
            <Text style={styles.headerTitle}>BREACH PROTOCOL</Text>
            <Text style={styles.headerSub}>{config.label}</Text>
          </View>

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

          <Text style={styles.instruction}>
            Match hex pairs to breach the firewall
          </Text>

          <View style={styles.grid}>
            {grid.map((cell) => (
              <View key={cell.id} style={[styles.cellWrapper, { width: `${100 / cols - 2}%` }]}>
                <HexCellButton
                  cell={cell}
                  selected={selected === cell.id}
                  wrong={wrongPair ? wrongPair.includes(cell.id) : false}
                  onPress={() => handleCellPress(cell.id)}
                  disabled={!gameActive}
                />
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.matchCount}>
              {matchedCount}/{config.pairs} BREACHED
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  cellWrapper: {
    aspectRatio: 1.6,
    minHeight: 44,
  },
  hexCell: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 3,
    backgroundColor: Colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  hexCode: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
  },
  footer: {
    marginTop: 14,
    alignItems: 'center',
  },
  matchCount: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.accent.neon,
    letterSpacing: 1.5,
    fontWeight: '600' as const,
  },
});
