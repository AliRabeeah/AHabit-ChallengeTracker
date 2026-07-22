import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

export default function NotesHeader({
  folderName = 'All Notes',
  onFolderPress,
  onMorePress,
  onSearchPress,
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onFolderPress} style={styles.folderBtn} hitSlop={6}>
          <Text style={[styles.folderText, { color: colors.primary }]} numberOfLines={1}>
            {folderName}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.primary} style={{ marginLeft: 2 }} />
        </TouchableOpacity>

        <View style={styles.rightIcons}>
          <TouchableOpacity onPress={onSearchPress} style={styles.iconBtn} hitSlop={6}>
            <Ionicons name="search" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onMorePress} style={styles.iconBtn} hitSlop={6}>
            <Ionicons name="ellipsis-horizontal-circle" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.largeTitle, { color: colors.text }]}>Notes</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 32,
  },
  folderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  folderText: {
    fontSize: 15,
    fontWeight: '600',
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  iconBtn: {
    padding: 2,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 6,
  },
});
