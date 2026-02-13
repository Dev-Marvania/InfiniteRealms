import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  Dimensions,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type BottomTab = 'command' | 'world';

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<BottomTab>('command');
  const [visitedTiles, setVisitedTiles] = useState<Set<string>>(
    new Set(['0,0']),
  );

  const {
    hp,
    mana,
    isThinking,
    location,
    inventory,
    history,
    currentMood,
    setThinking,
    addMessage,
    setHp,
    setMana,
    addItem,
    setLocation,
    setMood,
  } = useGameStore();

  const handleCommand = useCallback(
    (text: string) => {
      addMessage({ role: 'user', content: text });
      setThinking(true);

      const delay = 1200 + Math.random() * 1500;

      setTimeout(() => {
        const response = processCommand(text, location);

        addMessage({
          role: 'god',
          content: response.narrative,
          mood: response.mood,
        });

        if (response.hpChange !== 0) {
          setHp(hp + response.hpChange);
        }
        if (response.manaChange !== 0) {
          setMana(mana + response.manaChange);
        }
        if (response.newItem) {
          addItem(response.newItem);
        }
        if (response.newLocation) {
          setLocation(response.newLocation);
          setVisitedTiles((prev) => {
            const next = new Set(prev);
            next.add(`${response.newLocation!.x},${response.newLocation!.y}`);
            return next;
          });
        }

        setMood(response.mood);
        setThinking(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, delay);
    },
    [location, hp, mana],
  );

  const switchTab = (tab: BottomTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0A0A0F', '#0E0E18', '#12121A']}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <View
          style={[
            styles.screen,
            {
              paddingTop: (insets.top || webTopInset) + 8,
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

          <View style={styles.divider} />

          <View style={styles.zoneB}>
            <View style={styles.tabBar}>
              <Pressable
                onPress={() => switchTab('command')}
                style={[
                  styles.tab,
                  activeTab === 'command' && styles.tabActive,
                ]}
              >
                <Ionicons
                  name="game-controller"
                  size={16}
                  color={
                    activeTab === 'command'
                      ? Colors.accent.gold
                      : Colors.text.dim
                  }
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'command' && styles.tabTextActive,
                  ]}
                >
                  Command
                </Text>
              </Pressable>

              <Pressable
                onPress={() => switchTab('world')}
                style={[
                  styles.tab,
                  activeTab === 'world' && styles.tabActive,
                ]}
              >
                <MaterialCommunityIcons
                  name="map-legend"
                  size={16}
                  color={
                    activeTab === 'world'
                      ? Colors.accent.gold
                      : Colors.text.dim
                  }
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'world' && styles.tabTextActive,
                  ]}
                >
                  World
                </Text>
              </Pressable>
            </View>

            {activeTab === 'command' ? (
              <View style={styles.commandContent}>
                <StatBars hp={hp} mana={mana} />
                <CommandDeck onSend={handleCommand} disabled={isThinking} />
              </View>
            ) : (
              <Animated.ScrollView
                entering={FadeIn.duration(200)}
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
              </Animated.ScrollView>
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
  screen: {
    flex: 1,
  },
  zoneA: {
    flex: 1,
    minHeight: '45%',
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    height: 180,
  },
  narrativeContainer: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.subtle,
    marginHorizontal: 20,
    opacity: 0.5,
  },
  zoneB: {
    flex: 1,
    minHeight: '40%',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(212, 168, 70, 0.08)',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text.dim,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: Colors.accent.gold,
  },
  commandContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  worldScroll: {
    flex: 1,
  },
  worldContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 20,
  },
  worldSection: {
    backgroundColor: Colors.bg.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
});
