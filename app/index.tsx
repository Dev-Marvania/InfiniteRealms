import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  ScrollView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import { useGameStore } from '@/lib/useGameStore';
import { processCommand } from '@/lib/gameEngine';
import GodAvatar from '@/components/GodAvatar';
import NarrativeStream from '@/components/NarrativeStream';
import CommandDeck from '@/components/CommandDeck';
import WorldMap from '@/components/WorldMap';
import VisualInventory from '@/components/VisualInventory';
import StatBars from '@/components/StatBars';

type BottomTab = 'command' | 'world';

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<BottomTab>('command');
  const [visitedTiles, setVisitedTiles] = useState<Set<string>>(
    new Set(['0,0']),
  );

  const hp = useGameStore((s) => s.hp);
  const mana = useGameStore((s) => s.mana);
  const isThinking = useGameStore((s) => s.isThinking);
  const location = useGameStore((s) => s.location);
  const inventory = useGameStore((s) => s.inventory);
  const history = useGameStore((s) => s.history);
  const currentMood = useGameStore((s) => s.currentMood);

  const handleCommand = useCallback((text: string) => {
    const store = useGameStore.getState();
    store.addMessage({ role: 'user', content: text });
    store.setThinking(true);

    const delay = 1200 + Math.random() * 1500;

    setTimeout(() => {
      const currentState = useGameStore.getState();
      const response = processCommand(text, currentState.location);

      currentState.addMessage({
        role: 'god',
        content: response.narrative,
        mood: response.mood,
      });

      if (response.hpChange !== 0) {
        currentState.setHp(currentState.hp + response.hpChange);
      }
      if (response.manaChange !== 0) {
        currentState.setMana(currentState.mana + response.manaChange);
      }
      if (response.newItem) {
        currentState.addItem(response.newItem);
      }
      if (response.newLocation) {
        currentState.setLocation(response.newLocation);
        setVisitedTiles((prev) => {
          const next = new Set(prev);
          next.add(`${response.newLocation!.x},${response.newLocation!.y}`);
          return next;
        });
      }

      currentState.setMood(response.mood);
      currentState.setThinking(false);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }, delay);
  }, []);

  const switchTab = (tab: BottomTab) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setActiveTab(tab);
  };

  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#05050A', '#080812', '#0A0A14']}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <View
          style={[
            styles.screen,
            {
              paddingTop: (insets.top || webTopInset) + 4,
              paddingBottom: (insets.bottom || webBottomInset) + 4,
            },
          ]}
        >
          <View style={styles.zoneA}>
            <View style={styles.avatarContainer}>
              <GodAvatar isThinking={isThinking} mood={currentMood} />
            </View>

            <View style={styles.narrativeContainer}>
              <NarrativeStream history={history} isThinking={isThinking} />
            </View>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerDot} />
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.zoneB}>
            <View style={styles.tabBar}>
              <Pressable
                onPress={() => switchTab('command')}
                style={[
                  styles.tab,
                  activeTab === 'command' && styles.tabActive,
                ]}
                testID="tab-command"
              >
                <Ionicons
                  name="terminal"
                  size={14}
                  color={
                    activeTab === 'command'
                      ? Colors.accent.cyan
                      : Colors.text.dim
                  }
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'command' && styles.tabTextActive,
                  ]}
                >
                  {'TERMINAL'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => switchTab('world')}
                style={[
                  styles.tab,
                  activeTab === 'world' && styles.tabActive,
                ]}
                testID="tab-world"
              >
                <MaterialCommunityIcons
                  name="map-marker-radius"
                  size={14}
                  color={
                    activeTab === 'world'
                      ? Colors.accent.cyan
                      : Colors.text.dim
                  }
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'world' && styles.tabTextActive,
                  ]}
                >
                  {'SYSTEM'}
                </Text>
              </Pressable>
            </View>

            {activeTab === 'command' ? (
              <View style={styles.commandContent}>
                <StatBars hp={hp} mana={mana} />
                <CommandDeck onSend={handleCommand} disabled={isThinking} />
              </View>
            ) : (
              <ScrollView
                style={styles.worldScroll}
                contentContainerStyle={styles.worldContent}
                showsVerticalScrollIndicator={false}
              >
                <StatBars hp={hp} mana={mana} />
                <View style={styles.worldSection}>
                  <WorldMap location={location} visitedTiles={visitedTiles} />
                </View>
                <View style={styles.worldSection}>
                  <VisualInventory items={inventory} />
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  zoneA: {
    flex: 1,
    minHeight: '42%',
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
    height: 120,
  },
  narrativeContainer: {
    flex: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border.subtle,
  },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent.cyan,
    opacity: 0.5,
  },
  zoneB: {
    flex: 1,
    minHeight: '42%',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
    borderColor: Colors.border.subtle,
  },
  tabText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.text.dim,
    letterSpacing: 1.5,
  },
  tabTextActive: {
    color: Colors.accent.cyan,
  },
  commandContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 6,
  },
  worldScroll: {
    flex: 1,
  },
  worldContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 16,
    gap: 14,
  },
  worldSection: {
    backgroundColor: Colors.bg.card,
    borderRadius: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
});
