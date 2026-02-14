import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import * as Speech from 'expo-speech';
import Colors from '@/constants/colors';
import { HistoryEntry } from '@/lib/useGameStore';
import { startAmbient, stopAmbient } from '@/lib/soundManager';

interface NarrativeStreamProps {
  history: HistoryEntry[];
  isThinking: boolean;
}

function TypewriterText({ text, isLatest }: { text: string; isLatest: boolean }) {
  const [displayed, setDisplayed] = useState(isLatest ? '' : text);
  const indexRef = useRef(isLatest ? 0 : text.length);

  useEffect(() => {
    if (!isLatest || indexRef.current >= text.length) {
      setDisplayed(text);
      return;
    }

    const interval = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) {
        clearInterval(interval);
      }
    }, 35);

    return () => clearInterval(interval);
  }, [text, isLatest]);

  return (
    <Text style={styles.entryText}>
      {displayed}
      {isLatest && displayed.length < text.length && (
        <Text style={styles.cursor}>_</Text>
      )}
    </Text>
  );
}

function ThinkingIndicator() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % 4);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const frames = ['|', '/', '-', '\\'];

  return (
    <View style={[styles.entry, styles.godEntry]}>
      <Text style={styles.godLabel}>{'> PROCESSING'}</Text>
      <Text style={styles.thinkingText}>
        The Architect is computing {frames[frame]}
      </Text>
    </View>
  );
}

function speakText(text: string) {
  try {
    Speech.stop();
    const cleanText = text
      .replace(/\/\/.*$/gm, '')
      .replace(/`[^`]*`/g, '')
      .replace(/\{[^}]*\}/g, '')
      .replace(/[_*#]/g, '')
      .trim();
    if (cleanText.length > 0) {
      startAmbient().catch(() => {});
      Speech.speak(cleanText, {
        language: 'en-US',
        pitch: 0.75,
        rate: 0.85,
        onDone: () => { stopAmbient().catch(() => {}); },
        onStopped: () => { stopAmbient().catch(() => {}); },
      });
    }
  } catch {}
}

export default function NarrativeStream({ history, isThinking }: NarrativeStreamProps) {
  const scrollRef = useRef<ScrollView>(null);
  const lastSpokenIndex = useRef(-1);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [history.length, isThinking, scrollToEnd]);

  useEffect(() => {
    if (history.length === 0) return;
    const lastIndex = history.length - 1;
    const lastEntry = history[lastIndex];
    if (lastEntry.role === 'god' && lastIndex > lastSpokenIndex.current) {
      lastSpokenIndex.current = lastIndex;
      speakText(lastEntry.content);
    }
  }, [history.length]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onContentSizeChange={() => scrollToEnd()}
    >
      {history.map((entry, i) => {
        const isGod = entry.role === 'god';
        const isLatestGod = isGod && i === history.length - 1;

        return (
          <View
            key={i}
            style={[
              styles.entry,
              isGod ? styles.godEntry : styles.userEntry,
            ]}
          >
            {isGod && <Text style={styles.godLabel}>{'> THE ARCHITECT'}</Text>}
            {!isGod && <Text style={styles.userLabel}>{'> USER 001'}</Text>}
            {isGod ? (
              <TypewriterText
                text={entry.content}
                isLatest={isLatestGod}
              />
            ) : (
              <Text style={styles.userText}>{`> ${entry.content}`}</Text>
            )}
          </View>
        );
      })}
      {isThinking && <ThinkingIndicator />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    gap: 12,
  },
  entry: {
    paddingVertical: 6,
  },
  godEntry: {
    borderLeftWidth: 2,
    borderLeftColor: Colors.accent.cyan,
    paddingLeft: 12,
  },
  userEntry: {
    borderLeftWidth: 2,
    borderLeftColor: Colors.accent.neon,
    paddingLeft: 12,
  },
  godLabel: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: Colors.accent.cyan,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  userLabel: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: Colors.accent.neon,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  entryText: {
    fontFamily: 'Cinzel_400Regular',
    fontSize: 13,
    color: Colors.text.god,
    lineHeight: 20,
  },
  userText: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: Colors.text.user,
    lineHeight: 20,
  },
  thinkingText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: Colors.accent.cyan,
    lineHeight: 20,
  },
  cursor: {
    color: Colors.accent.cyan,
    fontFamily: 'monospace',
  },
});
