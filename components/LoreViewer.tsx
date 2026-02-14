import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { LORE_ENTRIES, LoreEntry } from '@/lib/loreData';

interface LoreViewerProps {
  discoveredLore: string[];
  visible: boolean;
  onClose: () => void;
}

function LoreCard({ entry, discovered }: { entry: LoreEntry; discovered: boolean }) {
  const [expanded, setExpanded] = React.useState(false);

  const actLabel = entry.act === 1 ? 'RECYCLE BIN' : entry.act === 2 ? 'NEON CITY' : 'THE SOURCE';
  const actColor = entry.act === 1 ? Colors.accent.neon : entry.act === 2 ? Colors.accent.cyan : Colors.accent.mysticGlow;

  if (!discovered) {
    return (
      <View style={[styles.card, styles.cardLocked]}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="lock" size={14} color={Colors.text.dim} />
          <Text style={styles.lockedTitle}>ENCRYPTED DATA</Text>
          <Text style={[styles.actBadge, { color: Colors.text.dim, borderColor: Colors.text.dim }]}>
            {actLabel}
          </Text>
        </View>
        <Text style={styles.lockedHint}>Search this zone to decrypt</Text>
      </View>
    );
  }

  return (
    <Pressable onPress={() => setExpanded(!expanded)}>
      <View style={[styles.card, styles.cardUnlocked]}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="file-document-outline" size={14} color={actColor} />
          <Text style={[styles.cardTitle, { color: actColor }]} numberOfLines={1}>
            {entry.title}
          </Text>
          <Text style={[styles.actBadge, { color: actColor, borderColor: actColor }]}>
            {actLabel}
          </Text>
        </View>
        {expanded && (
          <View style={styles.cardBody}>
            <Text style={styles.cardContent}>{entry.content}</Text>
          </View>
        )}
        {!expanded && (
          <Text style={styles.tapHint}>Tap to read</Text>
        )}
      </View>
    </Pressable>
  );
}

export default function LoreViewer({ discoveredLore, visible, onClose }: LoreViewerProps) {
  const total = LORE_ENTRIES.length;
  const found = discoveredLore.length;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons name="book-open-variant" size={18} color={Colors.accent.cyan} />
              <Text style={styles.headerTitle}>DATA LOGS</Text>
            </View>
            <Text style={styles.counter}>{found}/{total}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <MaterialCommunityIcons name="close" size={20} color={Colors.text.secondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {LORE_ENTRIES.map((entry) => (
              <LoreCard
                key={entry.id}
                entry={entry}
                discovered={discoveredLore.includes(entry.id)}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: '#08081A',
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: 4,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.accent.cyan,
    letterSpacing: 2,
  },
  counter: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.accent.neon,
    fontWeight: '600' as const,
    marginRight: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    gap: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 3,
    padding: 10,
  },
  cardLocked: {
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.bg.tertiary,
    opacity: 0.5,
  },
  cardUnlocked: {
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.bg.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockedTitle: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.text.dim,
    fontWeight: '600' as const,
    letterSpacing: 1,
  },
  cardTitle: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  actBadge: {
    fontFamily: 'monospace',
    fontSize: 8,
    fontWeight: '700' as const,
    letterSpacing: 1,
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  lockedHint: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: Colors.text.dim,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  cardBody: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  cardContent: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.text.primary,
    lineHeight: 18,
  },
  tapHint: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: Colors.text.dim,
    marginTop: 4,
  },
});
