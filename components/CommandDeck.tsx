import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface CommandDeckProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export default function CommandDeck({ onSend, disabled }: CommandDeckProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const micScale = useSharedValue(1);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSend(trimmed);
    setText('');
    inputRef.current?.focus();
  };

  const handleMicPressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    micScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 400, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  };

  const handleMicPressOut = () => {
    micScale.value = withTiming(1, { duration: 200 });
  };

  const micStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <View style={styles.inputWrap}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="What is your command?"
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

        <Pressable
          onPressIn={handleMicPressIn}
          onPressOut={handleMicPressOut}
          style={styles.micBtn}
        >
          <Animated.View style={micStyle}>
            <Ionicons name="mic" size={20} color={Colors.text.dim} />
          </Animated.View>
        </Pressable>

        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={[styles.sendBtn, canSend && styles.sendBtnActive]}
        >
          <Ionicons
            name="arrow-up"
            size={18}
            color={canSend ? '#0A0A0F' : Colors.text.dim}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: Colors.bg.input,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    paddingHorizontal: 16,
    height: 42,
    justifyContent: 'center',
  },
  input: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  micBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: Colors.accent.gold,
  },
});
