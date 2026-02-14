import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { InventoryItem, useGameStore } from '@/lib/useGameStore';
import { playSfx } from '@/lib/soundManager';

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

const EFFECT_LABELS: Record<string, string> = {
  patch: 'USE: +15 SYS_STABILITY',
  memory: 'USE: +20 ENERGY',
  debug: 'USE: -20 TRACE',
  exploit: 'USE: AUTO-HACK NEXT',
  proxy: 'USE: -35 TRACE',
  firewall: 'USE: +10 SYS_STABILITY',
};

const USABLE_ICONS = new Set(['patch', 'memory', 'debug', 'exploit', 'proxy', 'firewall']);

function ItemIcon({ icon, size = 20 }: { icon: string; size?: number }) {
  const mapping = ICON_MAP[icon] || { set: 'mci', name: 'help-circle', color: Colors.text.dim };
  if (mapping.set === 'mci') {
    return <MaterialCommunityIcons name={mapping.name as any} size={size} color={mapping.color} />;
  }
  return <Ionicons name={mapping.name as any} size={size} color={mapping.color} />;
}

export default function VisualInventory({ items }: VisualInventoryProps) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const handleItemPress = (item: InventoryItem) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setSelectedItem(item);
  };

  const handleUseItem = () => {
    if (!selectedItem) return;
    const store = useGameStore.getState();
    const result = store.useItem(selectedItem.id);
    setSelectedItem(null);

    if (result) {
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      playSfx('item').catch(() => {});
      store.addMessage({
        role: 'god',
        content: result.narrative,
        mood: 'mystic',
      });
    } else {
      store.addMessage({
        role: 'god',
        content: 'That item cannot be used directly.\n\n// THE ARCHITECT: "Not everything is a button, User 001."',
        mood: 'neutral',
      });
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="package-variant" size={24} color={Colors.text.dim} />
        <Text style={styles.emptyText}>{'// INVENTORY EMPTY'}</Text>
      </View>
    );
  }

  const isUsable = selectedItem ? USABLE_ICONS.has(selectedItem.icon) : false;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="package-variant" size={13} color={Colors.accent.cyan} />
        <Text style={styles.title}>{'INVENTORY'}</Text>
        <Text style={styles.hint}>TAP TO USE</Text>
        <Text style={styles.count}>[{items.length}]</Text>
      </View>
      <View style={styles.grid}>
        {items.map((item) => {
          const canUse = USABLE_ICONS.has(item.icon);
          return (
            <Pressable
              key={item.id}
              style={styles.itemCell}
              onPress={() => handleItemPress(item)}
            >
              <View style={[styles.itemIconWrap, canUse && styles.itemIconUsable]}>
                <ItemIcon icon={item.icon} />
                {canUse && <View style={styles.useDot} />}
              </View>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Modal
        visible={selectedItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedItem(null)}>
          <View style={styles.modalContent}>
            {selectedItem && (
              <>
                <View style={styles.modalHeader}>
                  <ItemIcon icon={selectedItem.icon} size={28} />
                  <Text style={styles.modalTitle}>{selectedItem.name}</Text>
                </View>
                {selectedItem.description && (
                  <Text style={styles.modalDesc}>{selectedItem.description}</Text>
                )}
                {EFFECT_LABELS[selectedItem.icon] && (
                  <Text style={styles.modalEffect}>{EFFECT_LABELS[selectedItem.icon]}</Text>
                )}
                <View style={styles.modalActions}>
                  {isUsable ? (
                    <Pressable style={styles.useBtn} onPress={handleUseItem}>
                      <MaterialCommunityIcons name="play-circle" size={16} color="#05050A" />
                      <Text style={styles.useBtnText}>EXECUTE</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.questLabel}>QUEST ITEM</Text>
                  )}
                  <Pressable style={styles.closeBtn} onPress={() => setSelectedItem(null)}>
                    <Text style={styles.closeBtnText}>CLOSE</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
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
    letterSpacing: 1.5,
  },
  hint: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: Colors.text.dim,
    flex: 1,
    letterSpacing: 1,
    opacity: 0.6,
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
  itemIconUsable: {
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  useDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#00FF88',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 10, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  modalContent: {
    backgroundColor: '#0A0A14',
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: 4,
    padding: 20,
    width: '100%',
    maxWidth: 300,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.accent.cyan,
    flex: 1,
    letterSpacing: 1,
  },
  modalDesc: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  modalEffect: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#00FF88',
    letterSpacing: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0, 255, 136, 0.06)',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.15)',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  useBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.accent.cyan,
    paddingVertical: 10,
    borderRadius: 4,
  },
  useBtnText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#05050A',
    letterSpacing: 1.5,
  },
  questLabel: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#FFB020',
    textAlign: 'center',
    paddingVertical: 10,
    letterSpacing: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 176, 32, 0.2)',
    borderRadius: 4,
  },
  closeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  closeBtnText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.text.dim,
    letterSpacing: 1,
  },
});
