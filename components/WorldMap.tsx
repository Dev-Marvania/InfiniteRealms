import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { GameLocation } from '@/lib/useGameStore';

interface WorldMapProps {
  location: GameLocation;
  visitedTiles: Set<string>;
}

type TileType = 'server' | 'firewall' | 'corrupted' | 'data' | 'terminal' | 'empty' | 'exit';

function getTileType(x: number, y: number): TileType {
  const seed = Math.abs(x * 7919 + y * 6271 + x * y * 31) % 100;
  if (seed < 15) return 'server';
  if (seed < 30) return 'firewall';
  if (seed < 48) return 'corrupted';
  if (seed < 60) return 'data';
  if (seed < 72) return 'terminal';
  if (seed < 78) return 'exit';
  return 'empty';
}

function TileIcon({ type }: { type: TileType }) {
  const iconSize = 13;

  switch (type) {
    case 'server':
      return <MaterialCommunityIcons name="server" size={iconSize} color="#4A7FBF" />;
    case 'firewall':
      return <MaterialCommunityIcons name="shield-alert" size={iconSize} color="#FF2244" />;
    case 'corrupted':
      return <MaterialCommunityIcons name="alert-decagram" size={iconSize} color="#9B7FD4" />;
    case 'data':
      return <MaterialCommunityIcons name="database" size={iconSize} color="#00FF88" />;
    case 'terminal':
      return <Ionicons name="terminal" size={iconSize} color="#00D4FF" />;
    case 'exit':
      return <MaterialCommunityIcons name="exit-run" size={iconSize} color="#FFB020" />;
    default:
      return <View style={styles.emptyDot} />;
  }
}

export default function WorldMap({ location, visitedTiles }: WorldMapProps) {
  const gridSize = 5;
  const half = Math.floor(gridSize / 2);

  const tiles = [];
  for (let dy = -half; dy <= half; dy++) {
    const row = [];
    for (let dx = -half; dx <= half; dx++) {
      const tileX = location.x + dx;
      const tileY = location.y + dy;
      const key = `${tileX},${tileY}`;
      const isPlayer = dx === 0 && dy === 0;
      const isVisited = visitedTiles.has(key);
      const tileType = getTileType(tileX, tileY);

      row.push(
        <View
          key={key}
          style={[
            styles.tile,
            isPlayer && styles.playerTile,
            !isVisited && !isPlayer && styles.fogTile,
          ]}
        >
          {isPlayer ? (
            <MaterialCommunityIcons name="account-circle" size={15} color={Colors.accent.cyan} />
          ) : isVisited ? (
            <TileIcon type={tileType} />
          ) : (
            <Text style={styles.fogText}>?</Text>
          )}
        </View>,
      );
    }
    tiles.push(
      <View key={dy} style={styles.row}>
        {row}
      </View>,
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="map-marker-radius" size={13} color={Colors.accent.cyan} />
        <Text style={styles.locationName}>{location.name}</Text>
        <Text style={styles.coords}>
          [{location.x},{location.y}]
        </Text>
      </View>
      <View style={styles.grid}>{tiles}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationName: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.accent.cyan,
    flex: 1,
    letterSpacing: 0.5,
  },
  coords: {
    fontSize: 9,
    color: Colors.text.dim,
    fontFamily: 'monospace',
  },
  grid: {
    gap: 2,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 2,
  },
  tile: {
    width: 40,
    height: 40,
    borderRadius: 3,
    backgroundColor: Colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  playerTile: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderColor: Colors.accent.cyan,
    borderWidth: 1.5,
  },
  fogTile: {
    backgroundColor: Colors.bg.primary,
    borderColor: 'rgba(26, 26, 48, 0.3)',
  },
  fogText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: 'rgba(64, 72, 96, 0.4)',
    fontWeight: '600' as const,
  },
  emptyDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.text.dim,
    opacity: 0.3,
  },
});
