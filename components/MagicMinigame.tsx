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

interface Puzzle {
  code: string;
  bug: string;
  options: string[];
  correct: number;
}

const PUZZLE_POOL: Puzzle[] = [
  {
    code: 'if (user.awake = true) {\n  escape();\n}',
    bug: 'Assignment instead of comparison',
    options: ['Change = to ==', 'Add return statement', 'Remove the if block'],
    correct: 0,
  },
  {
    code: 'for (let i = 0; i < 10; i--) {\n  scan(sector[i]);\n}',
    bug: 'Infinite loop - wrong increment',
    options: ['Change i < 10 to i > 0', 'Change i-- to i++', 'Add break statement'],
    correct: 1,
  },
  {
    code: 'const key = decrypt(data);\nconsole.log(keys);',
    bug: 'Typo in variable name',
    options: ['Change keys to key', 'Add let before keys', 'Remove console.log'],
    correct: 0,
  },
  {
    code: 'function hack() {\n  return\n  executeExploit();\n}',
    bug: 'Unreachable code after return',
    options: ['Remove return', 'Move return after executeExploit()', 'Change return to yield'],
    correct: 1,
  },
  {
    code: 'let trace = "100";\nif (trace > 50) {\n  alert();\n}',
    bug: 'String comparison instead of number',
    options: ['Change "100" to 100', 'Change > to >=', 'Add toString()'],
    correct: 0,
  },
  {
    code: 'const users = getUsers();\nusers.forEach(user => {\n  delete(user);\n});',
    bug: 'Cannot delete during iteration',
    options: ['Use filter() instead', 'Add break after delete', 'Use reverse()'],
    correct: 0,
  },
  {
    code: 'while (connected) {\n  sendData(packet);\n}\nconnected = false;',
    bug: 'connected never set to false inside loop',
    options: ['Move connected=false inside loop', 'Change while to if', 'Add timeout()'],
    correct: 0,
  },
  {
    code: 'const pass = input();\nif (pass == null || "") {\n  deny();\n}',
    bug: 'Incorrect empty string check',
    options: ['Change to pass == null || pass == ""', 'Remove null check', 'Add !== instead'],
    correct: 0,
  },
];

interface DifficultyConfig {
  rounds: number;
  timePerRound: number;
}

const DIFFICULTY: Record<number, DifficultyConfig> = {
  1: { rounds: 1, timePerRound: 15 },
  2: { rounds: 2, timePerRound: 12 },
  3: { rounds: 3, timePerRound: 10 },
};

interface MagicMinigameProps {
  visible: boolean;
  act: number;
  onComplete: (success: boolean) => void;
}

function OptionButton({
  label,
  index,
  onPress,
  disabled,
}: {
  label: string;
  index: number;
  onPress: () => void;
  disabled: boolean;
}) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.95, { duration: 60 }),
      withTiming(1, { duration: 100 }),
    );
    onPress();
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      <Animated.View style={[styles.optionButton, animStyle]}>
        <Text style={styles.optionPrefix}>{'>'} {index + 1}.</Text>
        <Text style={styles.optionLabel}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

function shuffleAndPick(count: number): Puzzle[] {
  const shuffled = [...PUZZLE_POOL];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

export default function MagicMinigame({ visible, act, onComplete }: MagicMinigameProps) {
  const config = DIFFICULTY[act] || DIFFICULTY[1];
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.rounds * config.timePerRound);
  const [gameActive, setGameActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const timerBarWidth = useSharedValue(1);
  const scanLineY = useSharedValue(0);
  const headerGlow = useSharedValue(0);
  const codeBlockFlash = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      const cfg = DIFFICULTY[act] || DIFFICULTY[1];
      const selected = shuffleAndPick(cfg.rounds);
      setPuzzles(selected);
      setCurrentRound(0);
      const totalTime = cfg.rounds * cfg.timePerRound;
      setTimeLeft(totalTime);
      setGameActive(true);

      timerBarWidth.value = 1;
      timerBarWidth.value = withTiming(0, {
        duration: totalTime * 1000,
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
      codeBlockFlash.value = 0;
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

  const handleOptionPress = useCallback(
    (optionIndex: number) => {
      if (!gameActive || puzzles.length === 0) return;

      const puzzle = puzzles[currentRound];
      if (!puzzle) return;

      if (optionIndex === puzzle.correct) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}

        codeBlockFlash.value = withSequence(
          withTiming(1, { duration: 100 }),
          withTiming(0, { duration: 300 }),
        );

        const nextRound = currentRound + 1;
        if (nextRound >= puzzles.length) {
          setGameActive(false);
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeout(() => onComplete(true), 400);
        } else {
          setCurrentRound(nextRound);
        }
      } else {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch {}
        setGameActive(false);
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeout(() => onComplete(false), 400);
      }
    },
    [gameActive, puzzles, currentRound, onComplete],
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

  const codeFlashStyle = useAnimatedStyle(() => ({
    opacity: codeBlockFlash.value,
  }));

  const currentPuzzle = puzzles[currentRound];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Animated.View style={[styles.scanLine, scanStyle]} />

          <View style={styles.header}>
            <Animated.View style={[styles.headerGlowBg, headerGlowStyle]} />
            <MaterialCommunityIcons
              name="code-braces"
              size={18}
              color={Colors.accent.cyan}
            />
            <Text style={styles.headerTitle}>CODE COMPILATION</Text>
            <Text style={styles.headerSub}>
              ROUND {currentRound + 1}/{config.rounds}
            </Text>
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

          {currentPuzzle && (
            <>
              <View style={styles.codeBlock}>
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: Colors.accent.neon, borderRadius: 4 },
                    codeFlashStyle,
                  ]}
                />
                <Text style={styles.codeText}>{currentPuzzle.code}</Text>
              </View>

              <View style={styles.bugHint}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={14}
                  color={Colors.accent.danger}
                />
                <Text style={styles.bugHintText}>
                  BUG DETECTED: {currentPuzzle.bug}
                </Text>
              </View>

              <View style={styles.optionsContainer}>
                <OptionButton
                  label={currentPuzzle.options[0]}
                  index={0}
                  onPress={() => handleOptionPress(0)}
                  disabled={!gameActive}
                />
                <OptionButton
                  label={currentPuzzle.options[1]}
                  index={1}
                  onPress={() => handleOptionPress(1)}
                  disabled={!gameActive}
                />
                <OptionButton
                  label={currentPuzzle.options[2]}
                  index={2}
                  onPress={() => handleOptionPress(2)}
                  disabled={!gameActive}
                />
              </View>
            </>
          )}

          <View style={styles.footer}>
            <Text style={styles.roundLabel}>
              {currentRound}/{config.rounds} COMPILED
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
  codeBlock: {
    backgroundColor: '#0C0C20',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.cyan,
    padding: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: Colors.text.primary,
    lineHeight: 20,
    zIndex: 1,
  },
  bugHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  bugHintText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: Colors.accent.danger,
    letterSpacing: 0.5,
    flex: 1,
  },
  optionsContainer: {
    gap: 8,
    marginBottom: 4,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: 3,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  optionPrefix: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.accent.cyan,
    fontWeight: '700' as const,
  },
  optionLabel: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.text.secondary,
    flex: 1,
  },
  footer: {
    marginTop: 14,
    alignItems: 'center',
  },
  roundLabel: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.accent.neon,
    letterSpacing: 1.5,
    fontWeight: '600' as const,
  },
});
