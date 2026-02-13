import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { InventoryItem } from '@/lib/useGameStore';

interface VisualInventoryProps {
  items: InventoryItem[];
}

const ICON_MAP: Record<string, { set: 'mci' | 'ion'; name: string; color: string }> = {
  debug: { set: 'mci', name: 'wrench', color: '#00E5FF' },
  patch: { set: 'mci', name: 'memory', color: '#00FF88' },
  exploit: { set: 'ion', name: 'key', color: '#FF2244' },
  firewall: { set: 'mci', name: 'shield-check', color: '#9B7FD4' },
  memory: { set: 'mci', name: 'chip', color: '#00D4FF' },
  token: { set: 'mci', name: 'key-chain', color: '#FFB020' },
  trace: { set: 'mci', name: 'file-document-outline', color: '#8090A8' },
  rootkit: { set: 'mci', name: 'console', color: '#FF00FF' },
  data: { set: 'mci', name: 'database', color: '#00FF88' },
  proxy: { set: 'ion', name: 'eye-off', color: '#6B7FBF' },
};

function ItemIcon({ icon }: { icon: string }) {
  const mapping = ICON_MAP[icon] || { set: 'mci', name: 'help-circle', color: Colors.text.dim };

  if (mapping.set === 'mci') {
    return (
      <MaterialCommunityIcons
        name={mapping.name as any}
        size={20}
        color={mapping.color}
      />
    );
  }
  return (
    <Ionicons name={mapping.name as any} size={20} color={mapping.color} />
  );
}

export default function VisualInventory({ items }: VisualInventoryProps) {
  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="package-variant" size={24} color={Colors.text.dim} />
        <Text style={styles.emptyText}>{'// INVENTORY EMPTY'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="package-variant" size={13} color={Colors.accent.cyan} />
        <Text style={styles.title}>{'INVENTORY'}</Text>
        <Text style={styles.count}>[{items.length}]</Text>
      </View>
      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.id} style={styles.itemCell}>
            <View style={styles.itemIconWrap}>
              <ItemIcon icon={item.icon} />
            </View>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.accent.cyan,
    flex: 1,
    letterSpacing: 1.5,
  },
  count: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: Colors.text.dim,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemCell: {
    width: 68,
    alignItems: 'center',
    gap: 4,
  },
  itemIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 4,
    backgroundColor: Colors.bg.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  emptyText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.text.dim,
  },
});
