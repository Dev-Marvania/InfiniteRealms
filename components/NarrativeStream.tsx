import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import Colors from '@/constants/colors';
import { HistoryEntry } from '@/lib/useGameStore';

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
    }, 22);

    return () => clearInterval(interval);
  }, [text, isLatest]);

  return (
    <Text style={styles.entryText}>
      {displayed}
      {isLatest && displayed.length < text.length && (
        <Text style={styles.cursor}>|</Text>
      )}
    </Text>
  );
}

function ThinkingIndicator() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.entry, styles.godEntry]}>
      <Text style={styles.godLabel}>The Narrator ponders{dots}</Text>
    </View>
  );
}

export default function NarrativeStream({ history, isThinking }: NarrativeStreamProps) {
  const scrollRef = useRef<ScrollView>(null);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [history.length, isThinking, scrollToEnd]);

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
            {isGod && <Text style={styles.godLabel}>The Narrator speaks</Text>}
            {!isGod && <Text style={styles.userLabel}>You declared</Text>}
            {isGod ? (
              <TypewriterText text={entry.content} isLatest={isLatestGod} />
            ) : (
              <Text style={styles.userText}>{entry.content}</Text>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 16,
  },
  entry: {
    paddingVertical: 8,
  },
  godEntry: {
    borderLeftWidth: 2,
    borderLeftColor: Colors.accent.gold,
    paddingLeft: 14,
  },
  userEntry: {
    borderLeftWidth: 2,
    borderLeftColor: Colors.accent.cyan,
    paddingLeft: 14,
  },
  godLabel: {
    fontFamily: 'Cinzel_400Regular',
    fontSize: 10,
    color: Colors.accent.goldDim,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  userLabel: {
    fontSize: 10,
    color: Colors.accent.cyan,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
    fontWeight: '600' as const,
  },
  entryText: {
    fontFamily: 'Cinzel_400Regular',
    fontSize: 14,
    color: Colors.text.god,
    lineHeight: 22,
  },
  userText: {
    fontSize: 14,
    color: Colors.text.user,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  cursor: {
    color: Colors.accent.gold,
    fontWeight: '300' as const,
  },
});
