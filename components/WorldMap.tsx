import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { GameLocation } from '@/lib/useGameStore';

interface WorldMapProps {
  location: GameLocation;
  visitedTiles: Set<string>;
}

type TileType = 'cave' | 'forest' | 'ruins' | 'river' | 'tower' | 'village' | 'empty';

function getTileType(x: number, y: number): TileType {
  const seed = Math.abs(x * 7919 + y * 6271 + x * y * 31) % 100;
  if (seed < 15) return 'cave';
  if (seed < 35) return 'forest';
  if (seed < 50) return 'ruins';
  if (seed < 62) return 'river';
  if (seed < 72) return 'tower';
  if (seed < 82) return 'village';
  return 'empty';
}

function TileIcon({ type }: { type: TileType }) {
  const iconSize = 14;
  const iconColor = Colors.text.dim;

  switch (type) {
    case 'cave':
      return <MaterialCommunityIcons name="cave" size={iconSize} color={iconColor} />;
    case 'forest':
      return <Ionicons name="leaf" size={iconSize} color="#3A6B3A" />;
    case 'ruins':
      return <MaterialCommunityIcons name="pillar" size={iconSize} color={iconColor} />;
    case 'river':
      return <Ionicons name="water" size={iconSize} color="#3A6B9F" />;
    case 'tower':
      return <MaterialCommunityIcons name="chess-rook" size={iconSize} color="#7B5EA7" />;
    case 'village':
      return <Ionicons name="home" size={iconSize} color="#8B7230" />;
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
            <MaterialCommunityIcons name="account" size={16} color={Colors.accent.gold} />
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
        <Ionicons name="compass" size={14} color={Colors.accent.gold} />
        <Text style={styles.locationName}>{location.name}</Text>
        <Text style={styles.coords}>
          [{location.x}, {location.y}]
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
    fontFamily: 'Cinzel_400Regular',
    fontSize: 12,
    color: Colors.text.primary,
    flex: 1,
  },
  coords: {
    fontSize: 10,
    color: Colors.text.dim,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  grid: {
    gap: 3,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 3,
  },
  tile: {
    width: 42,
    height: 42,
    borderRadius: 6,
    backgroundColor: Colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  playerTile: {
    backgroundColor: 'rgba(212, 168, 70, 0.15)',
    borderColor: Colors.accent.gold,
    borderWidth: 1.5,
  },
  fogTile: {
    backgroundColor: Colors.bg.primary,
    borderColor: 'rgba(42, 42, 58, 0.3)',
  },
  fogText: {
    fontSize: 12,
    color: 'rgba(90, 87, 80, 0.4)',
    fontWeight: '600' as const,
  },
  emptyDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.text.dim,
    opacity: 0.4,
  },
});
