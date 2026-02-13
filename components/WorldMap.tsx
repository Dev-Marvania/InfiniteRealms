import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Line, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { GameLocation } from '@/lib/useGameStore';

interface WorldMapProps {
  location: GameLocation;
  visitedTiles: Set<string>;
}

type NodeType = 'server' | 'firewall' | 'corrupted' | 'data' | 'terminal' | 'exit';

interface MapNode {
  id: string;
  x: number;
  y: number;
  type: NodeType;
  label: string;
  visited: boolean;
}

function getNodeType(x: number, y: number): NodeType {
  const seed = Math.abs(x * 7919 + y * 6271 + x * y * 31) % 100;
  if (seed < 15) return 'server';
  if (seed < 30) return 'firewall';
  if (seed < 48) return 'corrupted';
  if (seed < 60) return 'data';
  if (seed < 75) return 'terminal';
  return 'exit';
}

function getLocationLabel(x: number, y: number): string {
  const NAMES = [
    'Corrupted Lobby', 'Server Room B', 'Blue Screen of Death',
    'Packet Graveyard', 'Null Sector', 'Memory Leak Canyon',
    'Recursive Corridor', 'Deprecated API Ruins', 'Firewall Gate',
    'The Stack Overflow', 'Root Access Chamber', 'Cache Wasteland',
    'Segfault Caverns', 'Kernel Panic Zone', 'Binary Swamp',
    'Thread Pool', 'Registry Catacombs', 'The Sandbox',
    'Daemon\'s Den', 'Exit Node Approach',
  ];
  const idx = Math.abs(x * 7 + y * 13 + x * y * 3) % NAMES.length;
  return NAMES[idx];
}

const NODE_CONFIG: Record<NodeType, { icon: string; set: 'ion' | 'mci'; color: string; borderColor: string }> = {
  server: { icon: 'server', set: 'mci', color: '#bd00ff', borderColor: 'rgba(189, 0, 255, 0.6)' },
  firewall: { icon: 'shield-alert', set: 'mci', color: '#FF2244', borderColor: 'rgba(255, 34, 68, 0.6)' },
  corrupted: { icon: 'alert-decagram', set: 'mci', color: '#9B7FD4', borderColor: 'rgba(155, 127, 212, 0.5)' },
  data: { icon: 'database', set: 'mci', color: '#00FF88', borderColor: 'rgba(0, 255, 136, 0.5)' },
  terminal: { icon: 'terminal', set: 'ion', color: '#00D4FF', borderColor: 'rgba(0, 212, 255, 0.5)' },
  exit: { icon: 'exit-run', set: 'mci', color: '#FFB020', borderColor: 'rgba(255, 176, 32, 0.5)' },
};

const MAP_SIZE = 280;
const CENTER = MAP_SIZE / 2;
const NODE_RADIUS = 18;
const PLAYER_RADIUS = 22;

function PlayerNode() {
  const pulse = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);
  const ringScale = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, true,
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000, easing: Easing.linear }),
        withTiming(0.3, { duration: 1000, easing: Easing.linear }),
      ),
      -1, true,
    );
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: 2000, easing: Easing.out(Easing.ease) }),
        withTiming(1.0, { duration: 100, easing: Easing.linear }),
      ),
      -1, false,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: interpolate(ringScale.value, [1, 1.6], [0.6, 0]),
  }));

  return (
    <View style={styles.playerNodeContainer}>
      <Animated.View style={[styles.playerRing, ringStyle]} />
      <Animated.View style={[styles.playerGlow, glowStyle]} />
      <Animated.View style={[styles.playerCore, pulseStyle]}>
        <MaterialCommunityIcons name="account-circle" size={18} color="#020205" />
      </Animated.View>
      <View style={styles.youAreHereBadge}>
        <Text style={styles.youAreHereText}>YOU ARE HERE</Text>
      </View>
    </View>
  );
}

function SurroundingNode({ node, index }: { node: MapNode; index: number }) {
  const fadeIn = useSharedValue(0);
  const nodePulse = useSharedValue(1);

  useEffect(() => {
    fadeIn.value = withDelay(index * 80, withTiming(1, { duration: 400 }));
    nodePulse.value = withRepeat(
      withDelay(index * 200,
        withSequence(
          withTiming(1.08, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        ),
      ),
      -1, true,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ scale: nodePulse.value }],
  }));

  const config = NODE_CONFIG[node.type];

  if (!node.visited) {
    return (
      <Animated.View
        style={[
          styles.fogNode,
          {
            left: node.x - NODE_RADIUS,
            top: node.y - NODE_RADIUS,
          },
          animStyle,
        ]}
      >
        <Text style={styles.fogNodeText}>?</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.surroundingNode,
        {
          left: node.x - NODE_RADIUS,
          top: node.y - NODE_RADIUS,
          borderColor: config.borderColor,
          shadowColor: config.color,
        },
        animStyle,
      ]}
    >
      <View style={[styles.nodeGlowInner, { backgroundColor: config.color }]} />
      {config.set === 'mci' ? (
        <MaterialCommunityIcons name={config.icon as any} size={16} color={config.color} />
      ) : (
        <Ionicons name={config.icon as any} size={16} color={config.color} />
      )}
    </Animated.View>
  );
}

function ScanlineOverlay() {
  const scanY = useSharedValue(0);

  useEffect(() => {
    scanY.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.linear }),
      -1, false,
    );
  }, []);

  const scanStyle = useAnimatedStyle(() => ({
    top: `${scanY.value * 100}%` as any,
  }));

  return (
    <View style={styles.scanlineContainer} pointerEvents="none">
      {Array.from({ length: 40 }).map((_, i) => (
        <View key={i} style={styles.scanline} />
      ))}
      <Animated.View style={[styles.activeScanline, scanStyle]} />
    </View>
  );
}

function GlitchOverlay() {
  const glitch1 = useSharedValue(0);
  const glitch2 = useSharedValue(0);
  const glitch3 = useSharedValue(0);

  useEffect(() => {
    const runGlitch = (sv: Animated.SharedValue<number>, delay: number) => {
      sv.value = withRepeat(
        withDelay(delay,
          withSequence(
            withTiming(0, { duration: 2000 + Math.random() * 3000, easing: Easing.linear }),
            withTiming(1, { duration: 50, easing: Easing.linear }),
            withTiming(1, { duration: 80 + Math.random() * 120, easing: Easing.linear }),
            withTiming(0, { duration: 50, easing: Easing.linear }),
          ),
        ),
        -1, false,
      );
    };
    runGlitch(glitch1, 0);
    runGlitch(glitch2, 1500);
    runGlitch(glitch3, 3200);
  }, []);

  const g1Style = useAnimatedStyle(() => ({
    opacity: glitch1.value * 0.7,
    top: '15%' as any,
  }));
  const g2Style = useAnimatedStyle(() => ({
    opacity: glitch2.value * 0.5,
    top: '55%' as any,
  }));
  const g3Style = useAnimatedStyle(() => ({
    opacity: glitch3.value * 0.6,
    top: '78%' as any,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.glitchLine, g1Style]} />
      <Animated.View style={[styles.glitchLine, g2Style]} />
      <Animated.View style={[styles.glitchLine, g3Style]} />
    </View>
  );
}

function ConnectionLines({ nodes }: { nodes: MapNode[] }) {
  return (
    <Svg width={MAP_SIZE} height={MAP_SIZE} style={StyleSheet.absoluteFill}>
      <Defs>
        <SvgGradient id="lineGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#00f3ff" stopOpacity="0.6" />
          <Stop offset="1" stopColor="#bd00ff" stopOpacity="0.4" />
        </SvgGradient>
      </Defs>
      {nodes.map((node) => (
        <Line
          key={node.id}
          x1={CENTER}
          y1={CENTER}
          x2={node.x}
          y2={node.y}
          stroke="url(#lineGrad)"
          strokeWidth={1.5}
          strokeDasharray={node.visited ? undefined : "4,4"}
          opacity={node.visited ? 0.7 : 0.15}
        />
      ))}
    </Svg>
  );
}

function NodeLabel({ node }: { node: MapNode }) {
  if (!node.visited) return null;

  const isFirewall = node.type === 'firewall';
  const isExit = node.type === 'exit';
  const borderCol = isFirewall ? 'rgba(255, 34, 68, 0.5)' : isExit ? 'rgba(255, 176, 32, 0.5)' : 'rgba(0, 255, 136, 0.4)';
  const textCol = isFirewall ? '#FF4466' : isExit ? '#FFB020' : '#0aff00';

  const labelX = node.x < CENTER ? node.x - 30 : node.x - 30;
  const labelY = node.y < CENTER ? node.y - NODE_RADIUS - 16 : node.y + NODE_RADIUS + 4;

  return (
    <View
      style={[
        styles.nodeLabel,
        {
          left: Math.max(2, Math.min(labelX, MAP_SIZE - 72)),
          top: Math.max(2, Math.min(labelY, MAP_SIZE - 16)),
          borderColor: borderCol,
        },
      ]}
    >
      <Text style={[styles.nodeLabelText, { color: textCol }]} numberOfLines={1}>
        {node.label}
      </Text>
    </View>
  );
}

export default function WorldMap({ location, visitedTiles }: WorldMapProps) {
  const nodes = useMemo(() => {
    const result: MapNode[] = [];
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    const radiusBase = MAP_SIZE * 0.34;

    for (let i = 0; i < 8; i++) {
      const angle = (angles[i] * Math.PI) / 180;
      const radiusJitter = radiusBase + (i % 2 === 0 ? 8 : -4);
      const nx = CENTER + Math.cos(angle) * radiusJitter;
      const ny = CENTER + Math.sin(angle) * radiusJitter;

      const tileX = location.x + Math.round(Math.cos(angle));
      const tileY = location.y + Math.round(Math.sin(angle));
      const key = `${tileX},${tileY}`;

      result.push({
        id: key,
        x: nx,
        y: ny,
        type: getNodeType(tileX, tileY),
        label: getLocationLabel(tileX, tileY),
        visited: visitedTiles.has(key),
      });
    }
    return result;
  }, [location.x, location.y, visitedTiles]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>SYSTEM MAP</Text>
        <Text style={styles.headerDivider}>//</Text>
        <Text style={styles.headerSub}>UNKNOWN TERRITORY</Text>
      </View>

      <View style={styles.mapContainer}>
        <View style={styles.gridBg}>
          {Array.from({ length: 11 }).map((_, i) => (
            <View key={`h${i}`} style={[styles.gridLineH, { top: (MAP_SIZE / 10) * i }]} />
          ))}
          {Array.from({ length: 11 }).map((_, i) => (
            <View key={`v${i}`} style={[styles.gridLineV, { left: (MAP_SIZE / 10) * i }]} />
          ))}
        </View>

        <ConnectionLines nodes={nodes} />

        {nodes.map((node, i) => (
          <SurroundingNode key={node.id} node={node} index={i} />
        ))}

        {nodes.map((node) => (
          <NodeLabel key={`lbl-${node.id}`} node={node} />
        ))}

        <View style={[styles.playerNodePos, { left: CENTER - PLAYER_RADIUS, top: CENTER - PLAYER_RADIUS }]}>
          <PlayerNode />
        </View>

        <ScanlineOverlay />
        <GlitchOverlay />

        <LinearGradient
          colors={['rgba(2,2,5,0.95)', 'rgba(2,2,5,0)', 'rgba(2,2,5,0)', 'rgba(2,2,5,0.95)']}
          locations={[0, 0.2, 0.8, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['rgba(2,2,5,0.95)', 'rgba(2,2,5,0)', 'rgba(2,2,5,0)', 'rgba(2,2,5,0.95)']}
          locations={[0, 0.2, 0.8, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      <View style={styles.footer}>
        <MaterialCommunityIcons name="map-marker-radius" size={12} color={Colors.accent.cyan} />
        <Text style={styles.footerLocation}>{location.name}</Text>
        <Text style={styles.footerCoords}>[{location.x},{location.y}]</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 4,
  },
  headerText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#00f3ff',
    letterSpacing: 2,
    fontWeight: '700' as const,
  },
  headerDivider: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: 'rgba(0, 243, 255, 0.3)',
  },
  headerSub: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: 'rgba(0, 243, 255, 0.5)',
    letterSpacing: 1.5,
  },
  mapContainer: {
    width: MAP_SIZE,
    height: MAP_SIZE,
    alignSelf: 'center',
    backgroundColor: '#020205',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.15)',
    overflow: 'hidden',
  },
  gridBg: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(10, 255, 0, 0.04)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(10, 255, 0, 0.04)',
  },
  playerNodePos: {
    position: 'absolute',
    width: PLAYER_RADIUS * 2,
    height: PLAYER_RADIUS * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerNodeContainer: {
    width: PLAYER_RADIUS * 2,
    height: PLAYER_RADIUS * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerCore: {
    width: PLAYER_RADIUS * 2 - 8,
    height: PLAYER_RADIUS * 2 - 8,
    borderRadius: PLAYER_RADIUS,
    backgroundColor: '#00f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  playerGlow: {
    position: 'absolute',
    width: PLAYER_RADIUS * 2 + 12,
    height: PLAYER_RADIUS * 2 + 12,
    borderRadius: PLAYER_RADIUS + 6,
    backgroundColor: 'rgba(0, 243, 255, 0.2)',
    zIndex: 1,
  },
  playerRing: {
    position: 'absolute',
    width: PLAYER_RADIUS * 2,
    height: PLAYER_RADIUS * 2,
    borderRadius: PLAYER_RADIUS,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 243, 255, 0.5)',
    zIndex: 2,
  },
  youAreHereBadge: {
    position: 'absolute',
    bottom: -16,
    backgroundColor: '#00f3ff',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 2,
    zIndex: 4,
  },
  youAreHereText: {
    fontFamily: 'monospace',
    fontSize: 6,
    fontWeight: '700' as const,
    color: '#020205',
    letterSpacing: 0.8,
  },
  surroundingNode: {
    position: 'absolute',
    width: NODE_RADIUS * 2,
    height: NODE_RADIUS * 2,
    borderRadius: NODE_RADIUS,
    borderWidth: 1.5,
    backgroundColor: 'rgba(2, 2, 5, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeGlowInner: {
    position: 'absolute',
    width: NODE_RADIUS * 2 - 2,
    height: NODE_RADIUS * 2 - 2,
    borderRadius: NODE_RADIUS,
    opacity: 0.08,
  },
  fogNode: {
    position: 'absolute',
    width: NODE_RADIUS * 2,
    height: NODE_RADIUS * 2,
    borderRadius: NODE_RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(64, 72, 96, 0.2)',
    backgroundColor: 'rgba(2, 2, 5, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  fogNodeText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: 'rgba(64, 72, 96, 0.4)',
    fontWeight: '700' as const,
  },
  nodeLabel: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    backgroundColor: 'rgba(2, 2, 5, 0.8)',
    maxWidth: 80,
    zIndex: 5,
  },
  nodeLabelText: {
    fontFamily: 'monospace',
    fontSize: 6,
    letterSpacing: 0.3,
  },
  scanlineContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
  },
  scanline: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    marginBottom: 6,
  },
  activeScanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0, 243, 255, 0.06)',
  },
  glitchLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(0, 243, 255, 0.3)',
    zIndex: 7,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: 2,
  },
  footerLocation: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: Colors.accent.cyan,
    flex: 1,
    letterSpacing: 0.5,
  },
  footerCoords: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: Colors.text.dim,
  },
});
