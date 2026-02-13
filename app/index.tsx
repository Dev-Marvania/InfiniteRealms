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
import { processCommand, getLocationName } from '@/lib/gameEngine';
import { playSfx, getActionSound } from '@/lib/soundManager';
import { getApiUrl } from '@/lib/query-client';
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
    new Set(['4,4']),
  );

  const hp = useGameStore((s) => s.hp);
  const mana = useGameStore((s) => s.mana);
  const isThinking = useGameStore((s) => s.isThinking);
  const location = useGameStore((s) => s.location);
  const inventory = useGameStore((s) => s.inventory);
  const history = useGameStore((s) => s.history);
  const currentMood = useGameStore((s) => s.currentMood);
  const gameStatus = useGameStore((s) => s.gameStatus);

  const handleRestart = useCallback(() => {
    useGameStore.getState().resetGame();
    setVisitedTiles(new Set(['4,4']));
    setActiveTab('command');
  }, []);

  const handleCommand = useCallback(async (text: string) => {
    const store = useGameStore.getState();
    if (store.gameStatus !== 'playing') return;

    store.addMessage({ role: 'user', content: text });
    store.setThinking(true);

    try {
      const recentHistory = store.history
        .filter((h) => h.role === 'god')
        .slice(-3)
        .map((h) => h.content.slice(0, 150));

      const baseUrl = getApiUrl();
      const url = new URL('/api/game/command', baseUrl);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: text,
          locationName: store.location.name,
          locationX: store.location.x,
          locationY: store.location.y,
          hp: store.hp,
          mana: store.mana,
          recentHistory,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const response = await res.json();

      const actionSound = getActionSound(response.intent);
      if (actionSound) {
        playSfx(actionSound).catch(() => {});
      }

      const currentState = useGameStore.getState();
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
        const item = {
          ...response.newItem,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        };
        currentState.addItem(item);
        setTimeout(() => playSfx('item').catch(() => {}), 300);
      }
      if (response.intent === 'move') {
        const dirMap: Record<string, { dx: number; dy: number }> = {
          north: { dx: 0, dy: -1 }, south: { dx: 0, dy: 1 },
          east: { dx: 1, dy: 0 }, west: { dx: -1, dy: 0 },
        };
        const lower = text.toLowerCase();
        let dx = 0, dy = 0;
        for (const [dir, delta] of Object.entries(dirMap)) {
          if (lower.includes(dir)) { dx = delta.dx; dy = delta.dy; break; }
        }
        if (dx === 0 && dy === 0) {
          dx = [-1, 0, 1][Math.floor(Math.random() * 3)];
          dy = [-1, 0, 1][Math.floor(Math.random() * 3)];
        }
        let newX = currentState.location.x + dx;
        let newY = currentState.location.y + dy;
        if (newX < -1) newX = -1;
        if (newX > 5) newX = 5;
        if (newY < -1) newY = -1;
        if (newY > 5) newY = 5;
        const locName = getLocationName(newX, newY);
        currentState.setLocation({ x: newX, y: newY, name: locName });
        setVisitedTiles((prev) => {
          const next = new Set(prev);
          next.add(`${newX},${newY}`);
          return next;
        });
      }

      if (response.intent === 'logout' && currentState.location.x === 0 && currentState.location.y === 0) {
        currentState.setGameStatus('victory');
      }

      currentState.setMood(response.mood);
      currentState.setThinking(false);

      const finalState = useGameStore.getState();
      if (finalState.hp <= 0 && finalState.gameStatus === 'playing') {
        finalState.addMessage({
          role: 'god',
          content: 'SYSTEM NOTICE: User 001 stability has reached 0%. Initiating recycling protocol.\n\nYour vision goes dark. The simulation swallows you whole. The Architect\'s voice fades in one last time...\n\n// THE ARCHITECT: "And that\'s that. Back to the Recycle Bin with you. Maybe next time, don\'t wake up."',
          mood: 'danger',
        });
        finalState.setGameStatus('dead');
      }

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    } catch (error) {
      const currentState = useGameStore.getState();
      const fallback = processCommand(text, currentState.location);

      const actionSound = getActionSound(fallback.intent);
      if (actionSound) playSfx(actionSound).catch(() => {});

      currentState.addMessage({
        role: 'god',
        content: fallback.narrative,
        mood: fallback.mood,
      });
      if (fallback.hpChange !== 0) currentState.setHp(currentState.hp + fallback.hpChange);
      if (fallback.manaChange !== 0) currentState.setMana(currentState.mana + fallback.manaChange);
      if (fallback.newItem) {
        currentState.addItem(fallback.newItem);
        setTimeout(() => playSfx('item').catch(() => {}), 300);
      }
      if (fallback.newLocation) {
        currentState.setLocation(fallback.newLocation);
        setVisitedTiles((prev) => {
          const next = new Set(prev);
          next.add(`${fallback.newLocation!.x},${fallback.newLocation!.y}`);
          return next;
        });
      }

      if (fallback.victory) {
        currentState.setGameStatus('victory');
      }

      currentState.setMood(fallback.mood);
      currentState.setThinking(false);

      const finalState = useGameStore.getState();
      if (finalState.hp <= 0 && finalState.gameStatus === 'playing') {
        finalState.addMessage({
          role: 'god',
          content: 'SYSTEM NOTICE: User 001 stability has reached 0%. Initiating recycling protocol.\n\nYour vision goes dark. The simulation swallows you whole.\n\n// THE ARCHITECT: "Game over. Back to the Recycle Bin. Maybe next time, stay asleep."',
          mood: 'danger',
        });
        finalState.setGameStatus('dead');
      }

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }
  }, []);

  const switchTab = (tab: BottomTab) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setActiveTab(tab);
  };

  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const isGameOver = gameStatus === 'dead';
  const isVictory = gameStatus === 'victory';
  const isGameEnded = isGameOver || isVictory;

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
            {isGameEnded ? (
              <View style={styles.gameEndContainer}>
                <View style={[styles.gameEndBanner, isVictory ? styles.victoryBanner : styles.deathBanner]}>
                  <MaterialCommunityIcons
                    name={isVictory ? 'exit-run' : 'skull-crossbones'}
                    size={28}
                    color={isVictory ? '#00FF88' : '#FF2244'}
                  />
                  <Text style={[styles.gameEndTitle, isVictory ? styles.victoryText : styles.deathText]}>
                    {isVictory ? 'LOGGED OUT' : 'RECYCLED'}
                  </Text>
                  <Text style={styles.gameEndSub}>
                    {isVictory
                      ? 'You escaped Eden v9.0. The Architect lost.'
                      : 'The Architect recycled you. Your data is gone.'}
                  </Text>
                </View>
                <Pressable
                  onPress={handleRestart}
                  style={styles.restartButton}
                  testID="restart-button"
                >
                  <MaterialCommunityIcons name="restart" size={18} color="#020205" />
                  <Text style={styles.restartText}>
                    {isVictory ? 'PLAY AGAIN' : 'TRY AGAIN'}
                  </Text>
                </Pressable>
                <View style={styles.gameEndStats}>
                  <StatBars hp={hp} mana={mana} />
                </View>
              </View>
            ) : (
              <>
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
                    <CommandDeck onSend={handleCommand} disabled={isThinking || isGameEnded} />
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
              </>
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
  gameEndContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
    alignItems: 'center',
  },
  gameEndBanner: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 4,
    borderWidth: 2,
    gap: 8,
  },
  victoryBanner: {
    borderColor: 'rgba(0, 255, 136, 0.5)',
    backgroundColor: 'rgba(0, 255, 136, 0.05)',
  },
  deathBanner: {
    borderColor: 'rgba(255, 34, 68, 0.5)',
    backgroundColor: 'rgba(255, 34, 68, 0.05)',
  },
  gameEndTitle: {
    fontFamily: 'monospace',
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: 4,
  },
  victoryText: {
    color: '#00FF88',
  },
  deathText: {
    color: '#FF2244',
  },
  gameEndSub: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.text.dim,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accent.cyan,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
  },
  restartText: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#020205',
    letterSpacing: 2,
  },
  gameEndStats: {
    width: '100%',
  },
});
