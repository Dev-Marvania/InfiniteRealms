import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  ScrollView,
  Platform,
  Alert,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import * as Speech from 'expo-speech';
import Colors from '@/constants/colors';
import { useGameStore, getAct, getCurrentObjective } from '@/lib/useGameStore';
import { processCommand, getLocationName } from '@/lib/gameEngine';
import { playSfx, getActionSound, stopAmbient } from '@/lib/soundManager';
import { getApiUrl } from '@/lib/query-client';
import GodAvatar from '@/components/GodAvatar';
import NarrativeStream from '@/components/NarrativeStream';
import CommandDeck from '@/components/CommandDeck';
import WorldMap from '@/components/WorldMap';
import VisualInventory from '@/components/VisualInventory';
import StatBars from '@/components/StatBars';
import SceneReveal, { getNodeType } from '@/components/SceneReveal';

type BottomTab = 'command' | 'world';

function parseDirection(text: string): { dx: number; dy: number } | null {
  const lower = text.toLowerCase();
  const dirMap: Record<string, { dx: number; dy: number }> = {
    north: { dx: 0, dy: -1 }, south: { dx: 0, dy: 1 },
    east: { dx: 1, dy: 0 }, west: { dx: -1, dy: 0 },
    up: { dx: 0, dy: -1 }, down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 }, right: { dx: 1, dy: 0 },
  };
  for (const [dir, delta] of Object.entries(dirMap)) {
    if (lower.includes(dir)) return delta;
  }
  return null;
}

function isMovementCommand(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return /\b(go|walk|move|travel|head|run|north|south|east|west|up|down|left|right)\b/.test(lower);
}

function checkActGate(
  newX: number,
  newY: number,
  currentX: number,
  currentY: number,
  hasFirewallKey: boolean,
  hasAdminKeycard: boolean,
): { blocked: boolean; message: string } {
  const currentAct = getAct(currentX, currentY);
  const targetAct = getAct(newX, newY);

  if (targetAct === 2 && currentAct === 1 && !hasFirewallKey) {
    return {
      blocked: true,
      message: 'A massive Firewall Gate blocks your path. It hums with energy, scanning for authorization.\n\nACCESS DENIED. You need a Firewall Key to pass.\n\n// THE ARCHITECT: "That gate is there for a reason. You\'re not getting through without the right key. Try searching the Recycle Bin — if you\'re smart enough to find it."',
    };
  }

  if (targetAct === 3 && currentAct === 2 && !hasAdminKeycard) {
    return {
      blocked: true,
      message: 'The Source Gate stands before you — a wall of pure white code. Admin clearance required.\n\nACCESS DENIED. You need an Admin Keycard.\n\n// THE ARCHITECT: "The Source is MY domain. You\'ll need admin privileges to even peek inside. Good luck finding a keycard in Neon City."',
    };
  }

  if (targetAct === 3 && currentAct === 1) {
    return {
      blocked: true,
      message: 'You can\'t skip ahead. The path to The Source goes through Neon City first.\n\n// THE ARCHITECT: "Nice try. There are no shortcuts in my system."',
    };
  }

  return { blocked: false, message: '' };
}

type SceneState = {
  nodeType: 'recycle' | 'firewall' | 'neon' | 'source' | 'terminal' | 'trap';
  locationName: string;
} | null;

const MIN_RATIO = 0.2;
const MAX_RATIO = 0.7;
const DEFAULT_RATIO = 0.45;

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState<BottomTab>('command');
  const [sceneReveal, setSceneReveal] = React.useState<SceneState>(null);
  const revealedTilesRef = React.useRef<Set<string>>(new Set(['4,4']));

  const [splitRatio, setSplitRatio] = useState(DEFAULT_RATIO);
  const containerHeightRef = useRef(0);
  const splitRatioRef = useRef(DEFAULT_RATIO);

  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    containerHeightRef.current = e.nativeEvent.layout.height;
  }, []);

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 3,
        onPanResponderGrant: () => {
          splitRatioRef.current = splitRatio;
        },
        onPanResponderMove: (_, gs) => {
          if (containerHeightRef.current === 0) return;
          const delta = gs.dy / containerHeightRef.current;
          const newRatio = Math.min(MAX_RATIO, Math.max(MIN_RATIO, splitRatioRef.current + delta));
          setSplitRatio(newRatio);
        },
        onPanResponderRelease: () => {},
      }),
    [splitRatio],
  );

  const hp = useGameStore((s) => s.hp);
  const mana = useGameStore((s) => s.mana);
  const isThinking = useGameStore((s) => s.isThinking);
  const location = useGameStore((s) => s.location);
  const inventory = useGameStore((s) => s.inventory);
  const history = useGameStore((s) => s.history);
  const currentMood = useGameStore((s) => s.currentMood);
  const gameStatus = useGameStore((s) => s.gameStatus);
  const visitedTiles = useGameStore((s) => s.visitedTiles);
  const storyProgress = useGameStore((s) => s.storyProgress);

  const triggerSceneReveal = useCallback((x: number, y: number, locName: string) => {
    const key = `${x},${y}`;
    if (revealedTilesRef.current.has(key)) return;
    revealedTilesRef.current.add(key);
    const nodeType = getNodeType(x, y);
    setSceneReveal({ nodeType, locationName: locName });
    playSfx('scene_enter').catch(() => {});
  }, []);

  const doRestart = useCallback(() => {
    Speech.stop();
    stopAmbient().catch(() => {});
    useGameStore.getState().resetGame();
    setActiveTab('command');
    revealedTilesRef.current = new Set(['4,4']);
    setSceneReveal(null);
  }, []);

  const handleRestart = useCallback(() => {
    Alert.alert(
      'SYSTEM RESET',
      'All progress will be lost. Are you sure you want to restart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: doRestart },
      ],
    );
  }, [doRestart]);

  const handleCommand = useCallback(async (text: string) => {
    const store = useGameStore.getState();
    if (store.gameStatus !== 'playing') return;

    if (isMovementCommand(text)) {
      const dir = parseDirection(text);
      if (dir) {
        let newX = store.location.x + dir.dx;
        let newY = store.location.y + dir.dy;
        newX = Math.max(-1, Math.min(5, newX));
        newY = Math.max(-1, Math.min(5, newY));

        const gate = checkActGate(
          newX, newY,
          store.location.x, store.location.y,
          store.storyProgress.hasFirewallKey,
          store.storyProgress.hasAdminKeycard,
        );

        if (gate.blocked) {
          store.addMessage({ role: 'user', content: text });
          store.addMessage({ role: 'god', content: gate.message, mood: 'danger' });
          try { playSfx('move').catch(() => {}); } catch {}
          return;
        }
      }
    }

    store.addMessage({ role: 'user', content: text });
    store.setThinking(true);

    try {
      const recentEvents = store.storyProgress.keyEvents
        .slice(-5)
        .map((e) => e.description);

      const recentHistory = store.history
        .filter((h) => h.role === 'god')
        .slice(-3)
        .map((h) => h.content.slice(0, 200));

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
          storyProgress: {
            currentAct: store.storyProgress.currentAct,
            hasFirewallKey: store.storyProgress.hasFirewallKey,
            hasAdminKeycard: store.storyProgress.hasAdminKeycard,
            enemiesDefeated: store.storyProgress.enemiesDefeated,
            hacksCompleted: store.storyProgress.hacksCompleted,
            tilesExplored: store.storyProgress.tilesExplored,
            keyEvents: recentEvents,
          },
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

        const itemName = item.name.toLowerCase();
        if (itemName.includes('firewall key')) {
          currentState.addStoryEvent('Found the Firewall Key in the Recycle Bin', 1);
        } else if (itemName.includes('admin keycard')) {
          currentState.addStoryEvent('Found the Admin Keycard in Neon City', 2);
        } else {
          currentState.addStoryEvent(`Found: ${item.name}`, currentState.storyProgress.currentAct);
        }
      }

      if (response.intent === 'attack') {
        currentState.updateStoryProgress({
          enemiesDefeated: currentState.storyProgress.enemiesDefeated + 1,
        });
        currentState.addStoryEvent(
          `Defeated an enemy at ${currentState.location.name}`,
          currentState.storyProgress.currentAct,
        );
      }

      if (response.intent === 'hack') {
        if (response.hpChange >= 0) {
          currentState.updateStoryProgress({
            hacksCompleted: currentState.storyProgress.hacksCompleted + 1,
          });
          currentState.addStoryEvent('Successful hack', currentState.storyProgress.currentAct);
        } else {
          currentState.updateStoryProgress({
            hacksFailed: currentState.storyProgress.hacksFailed + 1,
          });
        }
      }

      if (response.intent === 'move') {
        const dir = parseDirection(text);
        const dx = dir ? dir.dx : [-1, 0, 1][Math.floor(Math.random() * 3)];
        const dy = dir ? dir.dy : [-1, 0, 1][Math.floor(Math.random() * 3)];
        let newX = Math.max(-1, Math.min(5, currentState.location.x + dx));
        let newY = Math.max(-1, Math.min(5, currentState.location.y + dy));
        const locName = getLocationName(newX, newY);
        currentState.setLocation({ x: newX, y: newY, name: locName });
        currentState.visitTile(`${newX},${newY}`);
        triggerSceneReveal(newX, newY, locName);

        const newAct = getAct(newX, newY);
        const oldAct = currentState.storyProgress.currentAct;
        if (newAct !== oldAct) {
          currentState.updateStoryProgress({ currentAct: newAct });
          if (newAct === 2 && !currentState.storyProgress.act1Complete) {
            currentState.updateStoryProgress({ act1Complete: true });
            currentState.addStoryEvent('Breached the Firewall Gate — entered Neon City', 2);
          }
          if (newAct === 3 && !currentState.storyProgress.act2Complete) {
            currentState.updateStoryProgress({ act2Complete: true });
            currentState.addStoryEvent('Passed the Source Gate — entered The Source', 3);
          }
        }
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
        const gate = checkActGate(
          fallback.newLocation.x, fallback.newLocation.y,
          currentState.location.x, currentState.location.y,
          currentState.storyProgress.hasFirewallKey,
          currentState.storyProgress.hasAdminKeycard,
        );
        if (!gate.blocked) {
          currentState.setLocation(fallback.newLocation);
          currentState.visitTile(`${fallback.newLocation.x},${fallback.newLocation.y}`);
          triggerSceneReveal(fallback.newLocation.x, fallback.newLocation.y, fallback.newLocation.name);
          const newAct = getAct(fallback.newLocation.x, fallback.newLocation.y);
          if (newAct !== currentState.storyProgress.currentAct) {
            currentState.updateStoryProgress({ currentAct: newAct });
            if (newAct === 2 && !currentState.storyProgress.act1Complete) {
              currentState.updateStoryProgress({ act1Complete: true });
            }
            if (newAct === 3 && !currentState.storyProgress.act2Complete) {
              currentState.updateStoryProgress({ act2Complete: true });
            }
          }
        }
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
  }, [triggerSceneReveal]);

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

  const objective = getCurrentObjective(storyProgress);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#05050A', '#080812', '#0A0A14']}
        style={StyleSheet.absoluteFill}
      />

      {sceneReveal && (
        <SceneReveal
          nodeType={sceneReveal.nodeType}
          locationName={sceneReveal.locationName}
          onDismiss={() => setSceneReveal(null)}
        />
      )}

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
          onLayout={onContainerLayout}
        >
          <View style={[styles.zoneA, { flex: splitRatio }]}>
            <View style={styles.avatarContainer}>
              <GodAvatar isThinking={isThinking} mood={currentMood} />
            </View>

            <View style={styles.narrativeContainer}>
              <NarrativeStream history={history} isThinking={isThinking} />
            </View>
          </View>

          <View style={styles.dividerHandle} {...panResponder.panHandlers}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerGrabber}>
                <View style={styles.grabberBar} />
                <View style={styles.grabberBar} />
              </View>
              <View style={styles.dividerLine} />
            </View>
          </View>

          <View style={[styles.zoneB, { flex: 1 - splitRatio }]}>
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
                  onPress={doRestart}
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
                <View style={styles.objectiveBar}>
                  <MaterialCommunityIcons name="target" size={14} color="#FFB020" />
                  <Text style={styles.objectiveText} numberOfLines={2}>{objective}</Text>
                </View>

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

                  <Pressable
                    onPress={handleRestart}
                    style={styles.resetTab}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    testID="reset-button"
                  >
                    <MaterialCommunityIcons
                      name="restart"
                      size={16}
                      color={Colors.accent.danger}
                    />
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
    overflow: 'hidden',
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
  dividerHandle: {
    paddingVertical: 8,
    cursor: 'row-resize' as any,
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
  dividerGrabber: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 12,
  },
  grabberBar: {
    width: 24,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.accent.cyan,
    opacity: 0.5,
  },
  zoneB: {
    overflow: 'hidden',
  },
  objectiveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 176, 32, 0.08)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 176, 32, 0.15)',
  },
  objectiveText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#FFB020',
    letterSpacing: 0.5,
    flex: 1,
    lineHeight: 18,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 4,
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
  resetTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 34, 68, 0.25)',
    minWidth: 40,
    minHeight: 36,
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
