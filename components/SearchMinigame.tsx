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

const WORD_POOLS: Record<number, string[]> = {
  1: ['PROXY', 'DEBUG', 'VIRUS', 'STACK', 'CACHE', 'PATCH', 'TOKEN', 'CRASH', 'BYTES', 'CODEC'],
  2: ['CIPHER', 'KERNEL', 'SOCKET', 'BUFFER', 'MALICE', 'DAEMON', 'SCRIPT', 'BINARY', 'PACKET', 'MIRROR'],
  3: ['DECRYPT', 'EXPLOIT', 'FIREWALL', 'PROTOCOL', 'TERMINAL', 'BACKDOOR', 'ROOTKIT', 'OVERFLOW'],
};

const DIFFICULTY: Record<number, { timeSeconds: number; label: string }> = {
  1: { timeSeconds: 20, label: 'TIER 1 ENCRYPTION' },
  2: { timeSeconds: 16, label: 'TIER 2 ENCRYPTION' },
  3: { timeSeconds: 13, label: 'TIER 3 ENCRYPTION' },
};

interface LetterCell {
  id: string;
  letter: string;
  used: boolean;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface SearchMinigameProps {
  visible: boolean;
  act: number;
  onComplete: (success: boolean) => void;
}

function SolutionSlot({ letter, filled, index }: { letter: string; filled: boolean; index: number }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (filled) {
      scale.value = withSequence(
        withTiming(1.2, { duration: 80 }),
        withTiming(1, { duration: 120 }),
      );
    }
  }, [filled]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.solutionSlot,
        filled && styles.solutionSlotFilled,
        animStyle,
      ]}
    >
      <Text style={[styles.solutionLetter, filled && styles.solutionLetterFilled]}>
        {filled ? letter : ''}
      </Text>
    </Animated.View>
  );
}

function ScrambledLetterButton({
  cell,
  onPress,
  disabled,
}: {
  cell: LetterCell;
  onPress: () => void;
  disabled: boolean;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (cell.used) {
      opacity.value = withTiming(0.2, { duration: 150 });
      scale.value = withTiming(0.85, { duration: 150 });
    } else {
      opacity.value = withTiming(1, { duration: 150 });
      scale.value = withTiming(1, { duration: 150 });
    }
  }, [cell.used]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable onPress={onPress} disabled={disabled || cell.used}>
      <Animated.View style={[styles.letterCell, animStyle]}>
        <Text style={styles.letterText}>{cell.letter}</Text>
      </Animated.View>
    </Pressable>
  );
}

function ShakeWrapper({ shake, children }: { shake: number; children: React.ReactNode }) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (shake > 0) {
      translateX.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [shake]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return <Animated.View style={animStyle}>{children}</Animated.View>;
}

export default function SearchMinigame({ visible, act, onComplete }: SearchMinigameProps) {
  const config = DIFFICULTY[act] || DIFFICULTY[1];
  const pool = WORD_POOLS[act] || WORD_POOLS[1];

  const [targetWord, setTargetWord] = useState('');
  const [scrambled, setScrambled] = useState<LetterCell[]>([]);
  const [placedLetters, setPlacedLetters] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.timeSeconds);
  const [gameActive, setGameActive] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const timerBarWidth = useSharedValue(1);
  const scanLineY = useSharedValue(0);
  const headerGlow = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      const newConfig = DIFFICULTY[act] || DIFFICULTY[1];
      const newPool = WORD_POOLS[act] || WORD_POOLS[1];
      const word = newPool[Math.floor(Math.random() * newPool.length)];
      setTargetWord(word);

      const letters: LetterCell[] = shuffleArray(
        word.split('').map((letter, i) => ({
          id: `${i}-${letter}-${Date.now()}`,
          letter,
          used: false,
        }))
      );
      setScrambled(letters);
      setPlacedLetters([]);
      setCurrentIndex(0);
      setTimeLeft(newConfig.timeSeconds);
      setGameActive(true);
      setShakeCount(0);

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

  const handleLetterPress = useCallback(
    (cellId: string) => {
      if (!gameActive) return;

      const cell = scrambled.find((c) => c.id === cellId);
      if (!cell || cell.used) return;

      const expectedLetter = targetWord[currentIndex];

      if (cell.letter === expectedLetter) {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}

        setScrambled((prev) =>
          prev.map((c) => (c.id === cellId ? { ...c, used: true } : c))
        );
        const newPlaced = [...placedLetters, cell.letter];
        setPlacedLetters(newPlaced);
        const newIndex = currentIndex + 1;
        setCurrentIndex(newIndex);

        if (newIndex >= targetWord.length) {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {}
          setGameActive(false);
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeout(() => onComplete(true), 400);
        }
      } else {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch {}
        setShakeCount((prev) => prev + 1);
      }
    },
    [scrambled, gameActive, targetWord, currentIndex, placedLetters, onComplete],
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
              name="file-search-outline"
              size={18}
              color={Colors.accent.cyan}
            />
            <Text style={styles.headerTitle}>DATA DECRYPTION</Text>
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
            Tap letters in correct order to decrypt
          </Text>

          <View style={styles.solutionRow}>
            {targetWord.split('').map((letter, i) => (
              <SolutionSlot
                key={`slot-${i}`}
                letter={placedLetters[i] || ''}
                filled={i < currentIndex}
                index={i}
              />
            ))}
          </View>

          <ShakeWrapper shake={shakeCount}>
            <View style={styles.scrambledRow}>
              {scrambled.map((cell) => (
                <ScrambledLetterButton
                  key={cell.id}
                  cell={cell}
                  onPress={() => handleLetterPress(cell.id)}
                  disabled={!gameActive}
                />
              ))}
            </View>
          </ShakeWrapper>

          <View style={styles.footer}>
            <Text style={styles.matchCount}>
              {currentIndex}/{targetWord.length} DECODED
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
  solutionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  solutionSlot: {
    width: 36,
    height: 42,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: 4,
    backgroundColor: Colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solutionSlotFilled: {
    borderColor: Colors.accent.neon,
    backgroundColor: 'rgba(0, 255, 136, 0.08)',
  },
  solutionLetter: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text.dim,
    letterSpacing: 1,
  },
  solutionLetterFilled: {
    color: Colors.accent.neon,
  },
  scrambledRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  letterCell: {
    width: 40,
    height: 46,
    borderWidth: 1,
    borderColor: Colors.accent.cyan,
    borderRadius: 4,
    backgroundColor: Colors.bg.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.accent.cyan,
    letterSpacing: 1,
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
