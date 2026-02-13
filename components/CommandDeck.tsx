import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Text,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface CommandDeckProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

function tryHaptic(style: Haptics.ImpactFeedbackStyle) {
  try {
    Haptics.impactAsync(style);
  } catch {}
}

const QUICK_COMMANDS = [
  { label: 'Go North', icon: 'compass-outline' as const, command: 'go north', set: 'ion' as const },
  { label: 'Go South', icon: 'compass-outline' as const, command: 'go south', set: 'ion' as const },
  { label: 'Go East', icon: 'compass-outline' as const, command: 'go east', set: 'ion' as const },
  { label: 'Go West', icon: 'compass-outline' as const, command: 'go west', set: 'ion' as const },
  { label: 'Attack', icon: 'flash' as const, command: 'attack', set: 'ion' as const },
  { label: 'Hack', icon: 'code-slash' as const, command: 'hack the system', set: 'ion' as const },
  { label: 'Search', icon: 'search' as const, command: 'search around', set: 'ion' as const },
  { label: 'Rest', icon: 'battery-charging' as const, command: 'rest', set: 'ion' as const },
  { label: 'Cast Spell', icon: 'sparkles' as const, command: 'cast spell', set: 'ion' as const },
];

function QuickCommandButton({ item, onPress, disabled }: { item: typeof QUICK_COMMANDS[0]; onPress: () => void; disabled: boolean }) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.92, { duration: 100 });
    glowOpacity.value = withTiming(1, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
    glowOpacity.value = withTiming(0, { duration: 300 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={styles.quickBtnOuter}
    >
      <Animated.View style={[styles.quickBtn, disabled && styles.quickBtnDisabled, animStyle]}>
        <Animated.View style={[styles.quickBtnGlow, glowStyle]} />
        <Ionicons name={item.icon} size={14} color={disabled ? Colors.text.dim : Colors.accent.cyan} />
        <Text style={[styles.quickBtnText, disabled && styles.quickBtnTextDisabled]}>{item.label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function CommandDeck({ onSend, disabled }: CommandDeckProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const sendScale = useSharedValue(1);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    tryHaptic(Haptics.ImpactFeedbackStyle.Medium);
    sendScale.value = withSequence(
      withTiming(0.85, { duration: 80 }),
      withTiming(1, { duration: 150 }),
    );
    onSend(trimmed);
    setText('');
    inputRef.current?.focus();
  };

  const handleQuickCommand = (command: string) => {
    if (disabled) return;
    tryHaptic(Haptics.ImpactFeedbackStyle.Light);
    onSend(command);
  };

  const sendAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickRow}
        style={styles.quickScroll}
      >
        {QUICK_COMMANDS.map((item) => (
          <QuickCommandButton
            key={item.command}
            item={item}
            onPress={() => handleQuickCommand(item.command)}
            disabled={disabled}
          />
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <View style={styles.inputWrap}>
          <TextInput
            ref={inputRef}
            testID="command-input"
            style={styles.input}
            placeholder="> enter command..."
            placeholderTextColor={Colors.text.dim}
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={!disabled}
            multiline={false}
            autoCorrect={false}
          />
        </View>

        <Animated.View style={sendAnimStyle}>
          <Pressable
            testID="send-button"
            onPress={handleSend}
            style={[styles.sendBtn, canSend && styles.sendBtnActive]}
          >
            <Ionicons
              name="terminal"
              size={18}
              color={canSend ? '#05050A' : Colors.text.dim}
            />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  quickScroll: {
    flexGrow: 0,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  quickBtnOuter: {},
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.bg.tertiary,
    overflow: 'hidden',
  },
  quickBtnDisabled: {
    opacity: 0.4,
  },
  quickBtnGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
  },
  quickBtnText: {
    fontSize: 11,
    color: Colors.accent.cyan,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  quickBtnTextDisabled: {
    color: Colors.text.dim,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: Colors.bg.input,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    paddingHorizontal: 14,
    height: 42,
    justifyContent: 'center',
  },
  input: {
    fontSize: 14,
    color: Colors.accent.cyan,
    fontFamily: 'monospace',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: Colors.bg.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: Colors.accent.cyan,
    borderColor: Colors.accent.cyan,
  },
});
