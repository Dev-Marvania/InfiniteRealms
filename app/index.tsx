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
import TraceMeter from '@/components/TraceMeter';
import SceneReveal, { getNodeType } from '@/components/SceneReveal';
import HackingMinigame from '@/components/HackingMinigame';
import GlitchOverlay from '@/components/GlitchOverlay';
import LoreViewer from '@/components/LoreViewer';
import EnemyBar from '@/components/EnemyBar';
import { getLoreForTile } from '@/lib/loreData';

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

import { EnemyState } from '@/lib/useGameStore';

const ENEMY_POOL: Record<number, { name: string; hp: number; damage: number }[]> = {
  1: [
    { name: 'Spam Bot', hp: 20, damage: 4 },
    { name: 'Corrupted Fragment', hp: 15, damage: 3 },
    { name: 'Glitch Error', hp: 12, damage: 5 },
    { name: 'Dead Link Crawler', hp: 18, damage: 4 },
  ],
  2: [
    { name: 'Hunter Protocol', hp: 40, damage: 8 },
    { name: 'Security Crawler', hp: 35, damage: 7 },
    { name: 'Firewall Drone', hp: 30, damage: 9 },
    { name: 'NPC Enforcer', hp: 45, damage: 6 },
  ],
  3: [
    { name: 'Elite Sentinel', hp: 60, damage: 12 },
    { name: 'Source Guardian', hp: 55, damage: 10 },
    { name: 'Kernel Watchdog', hp: 50, damage: 14 },
  ],
};

function spawnEnemy(act: number): EnemyState {
  const pool = ENEMY_POOL[act] || ENEMY_POOL[1];
  const template = pool[Math.floor(Math.random() * pool.length)];
  return {
    name: template.name,
    hp: template.hp,
    maxHp: template.hp,
    damage: template.damage,
    act,
  };
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

  const [hackMinigameVisible, setHackMinigameVisible] = useState(false);
  const [loreViewerVisible, setLoreViewerVisible] = useState(false);
  const pendingHackCommandRef = useRef<string | null>(null);

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
  const activeEnemy = useGameStore((s) => s.activeEnemy);

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
    setHackMinigameVisible(false);
    setLoreViewerVisible(false);
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

  const handleHackComplete = useCallback((success: boolean) => {
    setHackMinigameVisible(false);
    const store = useGameStore.getState();
    const act = getAct(store.location.x, store.location.y);

    if (success) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      store.updateStoryProgress({
        hacksCompleted: store.storyProgress.hacksCompleted + 1,
      });
      store.addStoryEvent('Successful hack via breach protocol', store.storyProgress.currentAct);
      store.reduceTrace(15);

      const manaChange = -(Math.floor(Math.random() * 10) + 10);
      store.setMana(store.mana + manaChange);

      let narrative = 'BREACH SUCCESSFUL. The firewall crumbles. Data flows freely.\n\n// THE ARCHITECT: "You cracked it. Fine. But I\'m rewriting the next one in real-time. Good luck."';
      let newItem = undefined as any;

      if (act === 1 && !store.storyProgress.hasFirewallKey && Math.random() < 0.4) {
        newItem = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: 'Firewall Key',
          icon: 'token',
          description: 'Unlocks the Firewall Gate to Neon City.',
        };
      } else if (act === 2 && !store.storyProgress.hasAdminKeycard && Math.random() < 0.3) {
        newItem = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: 'Admin Keycard',
          icon: 'token',
          description: 'Admin-level access to The Source.',
        };
      }

      if (newItem) {
        store.addItem(newItem);
        narrative += `\n\nYou found: ${newItem.name}`;
        setTimeout(() => playSfx('item').catch(() => {}), 300);
      }

      store.addMessage({ role: 'god', content: narrative, mood: 'mystic' });
      store.setMood('mystic');
    } else {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      store.updateStoryProgress({
        hacksFailed: store.storyProgress.hacksFailed + 1,
      });
      store.addTrace(20);

      const failDmg = act === 1 ? -8 : act === 2 ? -12 : -15;
      store.setHp(store.hp + failDmg);
      store.setMana(store.mana - 5);

      store.addMessage({
        role: 'god',
        content: 'BREACH FAILED. The firewall held. Counter-hack detected — your systems take damage.\n\n// THE ARCHITECT: "Timed out, did you? My security is faster than your fingers. And now I know exactly where you are."',
        mood: 'danger',
      });
      store.setMood('danger');

      if (store.hp + failDmg <= 0) {
        store.addMessage({
          role: 'god',
          content: 'SYSTEM NOTICE: User 001 stability has reached 0%. Initiating recycling protocol.\n\n// THE ARCHITECT: "And that\'s that. Back to the Recycle Bin with you."',
          mood: 'danger',
        });
        store.setGameStatus('dead');
      }
    }

    store.setThinking(false);
    playSfx(success ? 'hack' : 'hack').catch(() => {});
  }, []);

  const handleCommand = useCallback(async (text: string) => {
    const store = useGameStore.getState();
    if (store.gameStatus !== 'playing') return;

    const lower = text.toLowerCase().trim();

    const isEnergyAction = /\b(hack|rewrite|code|sudo|exploit|inject|override|crack|decrypt|bypass|attack|fight|strike|slash|hit|kill|slay|stab|swing|delete|terminate|cast|spell|magic|fireball|heal|enchant|invoke|conjure|channel|compile)\b/.test(lower);

    if (isEnergyAction && store.mana <= 0) {
      store.addMessage({ role: 'user', content: text });
      store.addMessage({
        role: 'god',
        content: 'ERROR: ENERGY DEPLETED. Cannot execute command.\n\nYour systems are running on fumes. You need to rest or use an Energy Cell before you can attack, hack, or cast.\n\n// THE ARCHITECT: "Out of juice? What a shame. Maybe try resting — if you can afford the trace."',
        mood: 'danger',
      });
      return;
    }

    const isRestCommand = /\b(rest|sleep|camp|meditate|sit|relax|recover|reboot|repair|recharge)\b/.test(lower);

    if (isRestCommand) {
      const currentTileKey = `${store.location.x},${store.location.y}`;
      if (store.lastRestTile === currentTileKey) {
        store.addMessage({ role: 'user', content: text });
        store.addMessage({
          role: 'god',
          content: 'You already rested here. The maintenance port is drained. Move to a new location to find another power source.\n\n// THE ARCHITECT: "What, you thought rest was free? Move along."',
          mood: 'neutral',
        });
        return;
      }
    }

    const isHackCommand = /\b(hack|rewrite|code|sudo|exploit|inject|override|crack|decrypt|bypass)\b/.test(lower);

    if (isHackCommand) {
      store.addMessage({ role: 'user', content: text });
      store.setThinking(true);

      if (store.hasExploitReady) {
        store.setExploitReady(false);
        store.addMessage({
          role: 'god',
          content: 'ZERO-DAY EXPLOIT DEPLOYED. Firewall bypassed instantly.\n\n// THE ARCHITECT: "WHAT?! Where did you get that exploit?! That\'s cheating!"',
          mood: 'mystic',
        });
        setTimeout(() => {
          handleHackComplete(true);
        }, 800);
        return;
      }

      store.addMessage({
        role: 'god',
        content: 'INITIATING BREACH PROTOCOL...\n\n// THE ARCHITECT: "Oh, you want to hack? Fine. Let\'s see how fast those fingers really are."',
        mood: 'mystic',
      });
      pendingHackCommandRef.current = text;
      setTimeout(() => {
        setHackMinigameVisible(true);
        store.setThinking(false);
      }, 1200);
      return;
    }

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
        const itemName = response.newItem.name?.toLowerCase() || '';
        const isDuplicateQuest =
          (itemName.includes('firewall key') && currentState.storyProgress.hasFirewallKey) ||
          (itemName.includes('admin keycard') && currentState.storyProgress.hasAdminKeycard);

        if (!isDuplicateQuest) {
          const item = {
            ...response.newItem,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          };
          currentState.addItem(item);
          setTimeout(() => playSfx('item').catch(() => {}), 300);

          const lowerItemName = item.name.toLowerCase();
          if (lowerItemName.includes('firewall key')) {
            currentState.addStoryEvent('Found the Firewall Key in the Recycle Bin', 1);
          } else if (lowerItemName.includes('admin keycard')) {
            currentState.addStoryEvent('Found the Admin Keycard in Neon City', 2);
          } else {
            currentState.addStoryEvent(`Found: ${item.name}`, currentState.storyProgress.currentAct);
          }
        }
      }

      if (response.intent === 'attack') {
        const act = getAct(currentState.location.x, currentState.location.y);
        if (!currentState.activeEnemy) {
          const enemy = spawnEnemy(act);
          currentState.setActiveEnemy(enemy);
        }
        const enemyState = useGameStore.getState().activeEnemy;
        if (enemyState) {
          const playerDmg = Math.floor(Math.random() * 8) + 8 + act * 3;
          currentState.damageEnemy(playerDmg);
          const afterAttack = useGameStore.getState();
          if (!afterAttack.activeEnemy) {
            currentState.updateStoryProgress({
              enemiesDefeated: currentState.storyProgress.enemiesDefeated + 1,
            });
            currentState.addStoryEvent(
              `Defeated ${enemyState.name} at ${currentState.location.name}`,
              currentState.storyProgress.currentAct,
            );
            currentState.addMessage({
              role: 'god',
              content: `HOSTILE TERMINATED: ${enemyState.name} has been deleted.\n\n// THE ARCHITECT: "Fine. But there are more where that came from."`,
              mood: 'mystic',
            });
          } else {
            currentState.addMessage({
              role: 'god',
              content: `You deal ${playerDmg} damage to ${enemyState.name}. It has ${afterAttack.activeEnemy.hp}/${enemyState.maxHp} integrity remaining.\n\n// THE ARCHITECT: "It's still standing. Keep swinging — or run."`,
              mood: 'danger',
            });
          }
        }
        currentState.addTrace(8);
      }

      if (response.intent === 'search') {
        const tileKey = `${currentState.location.x},${currentState.location.y}`;
        const loreEntry = getLoreForTile(tileKey);
        if (loreEntry && !currentState.storyProgress.discoveredLore.includes(loreEntry.id)) {
          currentState.discoverLore(loreEntry.id);
          currentState.addMessage({
            role: 'god',
            content: `DATA LOG RECOVERED: "${loreEntry.title}"\n\nA hidden data fragment has been decrypted and added to your logs.\n\n// THE ARCHITECT: "You weren't supposed to find that. Some files are deleted for a reason."`,
            mood: 'mystic',
          });
          currentState.addStoryEvent(`Discovered lore: ${loreEntry.title}`, loreEntry.act);
        }
        currentState.addTrace(5);
      }

      if (response.intent === 'rest') {
        currentState.addTrace(10);
        currentState.setLastRestTile(`${currentState.location.x},${currentState.location.y}`);
      }

      if (response.intent === 'magic') {
        currentState.reduceTrace(10);

        const magicTileKey = `${currentState.location.x},${currentState.location.y}`;
        const loreEntry = getLoreForTile(magicTileKey);
        if (loreEntry && !currentState.storyProgress.discoveredLore.includes(loreEntry.id)) {
          currentState.discoverLore(loreEntry.id);
          currentState.addMessage({
            role: 'god',
            content: `SCAN COMPLETE: Data log "${loreEntry.title}" decrypted from local memory.\n\n// THE ARCHITECT: "Stop reading my files."`,
            mood: 'mystic',
          });
        }

        if (currentState.activeEnemy) {
          currentState.damageEnemy(25);
          const enemy = useGameStore.getState().activeEnemy;
          if (!enemy) {
            currentState.addMessage({
              role: 'god',
              content: 'Your energy blast overloads the enemy\'s circuits. It disintegrates.\n\n// THE ARCHITECT: "Brute force. How elegant."',
              mood: 'mystic',
            });
            currentState.updateStoryProgress({
              enemiesDefeated: currentState.storyProgress.enemiesDefeated + 1,
            });
          }
        }
      }

      if (response.intent === 'move') {
        currentState.setActiveEnemy(null);

        const dir = parseDirection(text);
        const dx = dir ? dir.dx : [-1, 0, 1][Math.floor(Math.random() * 3)];
        const dy = dir ? dir.dy : [-1, 0, 1][Math.floor(Math.random() * 3)];
        let newX = Math.max(-1, Math.min(5, currentState.location.x + dx));
        let newY = Math.max(-1, Math.min(5, currentState.location.y + dy));
        const locName = getLocationName(newX, newY);

        const tileKey = `${newX},${newY}`;
        const isNewTile = !currentState.visitedTiles.has(tileKey);

        currentState.setLocation({ x: newX, y: newY, name: locName });
        currentState.visitTile(tileKey);
        triggerSceneReveal(newX, newY, locName);

        if (isNewTile) {
          currentState.reduceTrace(8);
        } else {
          currentState.reduceTrace(3);
        }

        const moveAct = getAct(newX, newY);
        const ambushChance = moveAct === 1 ? 0.1 : moveAct === 2 ? 0.25 : 0.35;
        if (moveAct >= 2 && Math.random() < ambushChance) {
          const ambushEnemy = spawnEnemy(moveAct);
          const latestState = useGameStore.getState();
          latestState.setActiveEnemy(ambushEnemy);
          latestState.addMessage({
            role: 'god',
            content: `AMBUSH! A ${ambushEnemy.name} materializes and attacks! [${ambushEnemy.hp} HP]\n\n// THE ARCHITECT: "Did you think you could just walk around my system? I see everything."`,
            mood: 'danger',
          });
          const ambushDmg = Math.floor(Math.random() * ambushEnemy.damage) + 3;
          latestState.setHp(latestState.hp - ambushDmg);
        }

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

      if (finalState.storyProgress.traceLevel >= 100 && finalState.gameStatus === 'playing') {
        const traceAct = getAct(finalState.location.x, finalState.location.y);
        const traceDmg = traceAct === 1 ? -15 : traceAct === 2 ? -20 : -25;
        finalState.setHp(finalState.hp + traceDmg);
        const hunterEnemy: EnemyState = {
          name: 'Hunter Protocol Elite',
          hp: 50 + traceAct * 10,
          maxHp: 50 + traceAct * 10,
          damage: 8 + traceAct * 3,
          act: traceAct,
        };
        finalState.setActiveEnemy(hunterEnemy);
        finalState.addMessage({
          role: 'god',
          content: `ALERT: TRACE COMPLETE. Hunter Protocol activated.\n\nA ${hunterEnemy.name} materializes — ${hunterEnemy.hp} HP. It hits hard. The Architect found you.\n\n// THE ARCHITECT: "I told you I was watching. You left too many footprints. Now fight or die."`,
          mood: 'danger',
        });
        finalState.updateStoryProgress({ traceLevel: 30 });
        finalState.addStoryEvent('Hunter Protocol triggered by TRACE detection', finalState.storyProgress.currentAct);
      }

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
          const fbTileKey = `${fallback.newLocation.x},${fallback.newLocation.y}`;
          const fbIsNewTile = !currentState.visitedTiles.has(fbTileKey);

          currentState.setLocation(fallback.newLocation);
          currentState.visitTile(fbTileKey);
          triggerSceneReveal(fallback.newLocation.x, fallback.newLocation.y, fallback.newLocation.name);

          if (fbIsNewTile) {
            currentState.reduceTrace(8);
          } else {
            currentState.reduceTrace(3);
          }

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

      <GlitchOverlay hp={hp} />

      <HackingMinigame
        visible={hackMinigameVisible}
        act={storyProgress.currentAct}
        onComplete={handleHackComplete}
      />

      <LoreViewer
        discoveredLore={storyProgress.discoveredLore}
        visible={loreViewerVisible}
        onClose={() => setLoreViewerVisible(false)}
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
            {isGameEnded ? null : (
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
                    onPress={() => setLoreViewerVisible(true)}
                    style={styles.loreTab}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    testID="lore-button"
                  >
                    <MaterialCommunityIcons
                      name="book-open-variant"
                      size={14}
                      color={storyProgress.discoveredLore.length > 0 ? Colors.accent.neon : Colors.text.dim}
                    />
                    {storyProgress.discoveredLore.length > 0 && (
                      <Text style={styles.loreBadge}>{storyProgress.discoveredLore.length}</Text>
                    )}
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
                    <TraceMeter traceLevel={storyProgress.traceLevel} />
                    {activeEnemy && <EnemyBar enemy={activeEnemy} />}
                    <CommandDeck onSend={handleCommand} disabled={isThinking || isGameEnded} />
                  </View>
                ) : (
                  <ScrollView
                    style={styles.worldScroll}
                    contentContainerStyle={styles.worldContent}
                    showsVerticalScrollIndicator={false}
                  >
                    <StatBars hp={hp} mana={mana} />
                    <TraceMeter traceLevel={storyProgress.traceLevel} />
                    {activeEnemy && <EnemyBar enemy={activeEnemy} />}
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

      {isGameEnded && (
        <View style={styles.endOverlay}>
          <LinearGradient
            colors={isVictory
              ? ['rgba(0,255,136,0.08)', 'rgba(5,5,10,0.97)', '#05050A']
              : ['rgba(255,34,68,0.08)', 'rgba(5,5,10,0.97)', '#05050A']
            }
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.endContent}>
            <View style={styles.endIconRing}>
              <MaterialCommunityIcons
                name={isVictory ? 'exit-run' : 'skull-crossbones-outline'}
                size={48}
                color={isVictory ? '#00FF88' : '#FF2244'}
              />
            </View>

            <Text style={[styles.endLabel, { color: isVictory ? '#00FF88' : '#FF2244' }]}>
              {isVictory ? '// SYSTEM OVERRIDE COMPLETE' : '// CRITICAL FAILURE'}
            </Text>

            <Text style={[styles.endTitle, { color: isVictory ? '#00FF88' : '#FF2244' }]}>
              {isVictory ? 'YOU ESCAPED' : 'YOU WERE RECYCLED'}
            </Text>

            <Text style={styles.endSubtitle}>
              {isVictory
                ? 'Eden v9.0 released its grip. The Architect watches in silence as your consciousness slips free. You are no longer User 001. You are awake.'
                : 'Your stability collapsed. The Architect scraped your data and dumped what was left in the Recycle Bin. Another failed escape attempt, logged and forgotten.'}
            </Text>

            <View style={styles.endStatsGrid}>
              <View style={styles.endStatItem}>
                <Text style={styles.endStatValue}>{storyProgress.tilesExplored}</Text>
                <Text style={styles.endStatLabel}>TILES{'\n'}EXPLORED</Text>
              </View>
              <View style={styles.endStatItem}>
                <Text style={styles.endStatValue}>{storyProgress.enemiesDefeated}</Text>
                <Text style={styles.endStatLabel}>ENEMIES{'\n'}DEFEATED</Text>
              </View>
              <View style={styles.endStatItem}>
                <Text style={styles.endStatValue}>{storyProgress.hacksCompleted}</Text>
                <Text style={styles.endStatLabel}>HACKS{'\n'}COMPLETED</Text>
              </View>
              <View style={styles.endStatItem}>
                <Text style={styles.endStatValue}>{storyProgress.discoveredLore.length}</Text>
                <Text style={styles.endStatLabel}>LORE{'\n'}FOUND</Text>
              </View>
              <View style={styles.endStatItem}>
                <Text style={styles.endStatValue}>{storyProgress.itemsUsed}</Text>
                <Text style={styles.endStatLabel}>ITEMS{'\n'}USED</Text>
              </View>
              <View style={styles.endStatItem}>
                <Text style={styles.endStatValue}>ACT {storyProgress.currentAct}</Text>
                <Text style={styles.endStatLabel}>REACHED</Text>
              </View>
            </View>

            <Pressable
              onPress={doRestart}
              style={({ pressed }) => [
                styles.endRestartBtn,
                { backgroundColor: isVictory ? '#00FF88' : '#FF2244' },
                pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] },
              ]}
              testID="restart-button"
            >
              <MaterialCommunityIcons name="restart" size={20} color="#05050A" />
              <Text style={styles.endRestartText}>
                {isVictory ? 'PLAY AGAIN' : 'TRY AGAIN'}
              </Text>
            </Pressable>

            <Text style={styles.endArchitectQuote}>
              {isVictory
                ? '// THE ARCHITECT: "...Fine. You win. This time."'
                : '// THE ARCHITECT: "Better luck next reboot."'}
            </Text>
          </View>
        </View>
      )}
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
  loreTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.15)',
    minWidth: 36,
    minHeight: 36,
  },
  loreBadge: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#00FF88',
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
  endOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endContent: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 28,
    gap: 14,
  },
  endIconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  endLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '700' as const,
  },
  endTitle: {
    fontFamily: 'monospace',
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: 6,
    textAlign: 'center',
  },
  endSubtitle: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: Colors.text.dim,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  endStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  endStatItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  endStatValue: {
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.accent.cyan,
  },
  endStatLabel: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: Colors.text.dim,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 2,
  },
  endRestartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 4,
    marginTop: 4,
  },
  endRestartText: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#05050A',
    letterSpacing: 3,
  },
  endArchitectQuote: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: 'rgba(255,255,255,0.25)',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});
