import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { InventoryItem } from '@/lib/useGameStore';

interface VisualInventoryProps {
  items: InventoryItem[];
}

const ICON_MAP: Record<string, { set: 'mci' | 'ion'; name: string; color: string }> = {
  sword: { set: 'mci', name: 'sword', color: '#8B9DB8' },
  flask: { set: 'mci', name: 'flask-round-bottom', color: '#A87FD4' },
  map: { set: 'ion', name: 'map', color: '#D4A846' },
  gem: { set: 'mci', name: 'diamond-stone', color: '#C44040' },
  shield: { set: 'mci', name: 'shield', color: '#4A7FBF' },
  scroll: { set: 'mci', name: 'script-text', color: '#D4C9A8' },
  potion: { set: 'mci', name: 'bottle-tonic', color: '#3ABDC2' },
  ring: { set: 'mci', name: 'ring', color: '#D4A846' },
  key: { set: 'ion', name: 'key', color: '#E8A838' },
  torch: { set: 'mci', name: 'torch', color: '#E8A838' },
  armor: { set: 'mci', name: 'tshirt-crew', color: '#6B7B8B' },
  bow: { set: 'mci', name: 'bow-arrow', color: '#7B6B4A' },
  book: { set: 'ion', name: 'book', color: '#8B5A3A' },
  coin: { set: 'mci', name: 'currency-usd', color: '#D4A846' },
  crystal: { set: 'mci', name: 'diamond', color: '#7FD4E8' },
};

function ItemIcon({ icon }: { icon: string }) {
  const mapping = ICON_MAP[icon] || { set: 'mci', name: 'help-circle', color: Colors.text.dim };

  if (mapping.set === 'mci') {
    return (
      <MaterialCommunityIcons
        name={mapping.name as any}
        size={22}
        color={mapping.color}
      />
    );
  }
  return (
    <Ionicons name={mapping.name as any} size={22} color={mapping.color} />
  );
}

export default function VisualInventory({ items }: VisualInventoryProps) {
  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cube-outline" size={28} color={Colors.text.dim} />
        <Text style={styles.emptyText}>Your satchel is empty</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="cube" size={14} color={Colors.accent.gold} />
        <Text style={styles.title}>Inventory</Text>
        <Text style={styles.count}>{items.length}</Text>
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
    fontFamily: 'Cinzel_400Regular',
    fontSize: 12,
    color: Colors.text.primary,
    flex: 1,
  },
  count: {
    fontSize: 11,
    color: Colors.text.dim,
    fontWeight: '600' as const,
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
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.bg.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 9,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.text.dim,
    fontStyle: 'italic',
  },
});
