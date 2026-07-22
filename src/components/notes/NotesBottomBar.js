import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';

export default function NotesBottomBar({ noteCount = 0, onNewNote }) {
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom || 8 }]} pointerEvents="box-none">
      <BlurView
        intensity={60}
        tint={mode === 'dark' ? 'dark' : 'light'}
        style={[styles.blur, { borderTopColor: colors.border }]}
      >
        <View style={styles.row}>
          <View style={styles.spacer} />
          <Text style={[styles.countText, { color: colors.textSecondary }]}>
            {noteCount} {noteCount === 1 ? 'Note' : 'Notes'}
          </Text>
          <View style={styles.spacer} />
        </View>
      </BlurView>

      <TouchableOpacity
        onPress={onNewNote}
        activeOpacity={0.85}
        style={[styles.fab, { backgroundColor: colors.primary, bottom: (insets.bottom || 8) + 14 }]}
      >
        <Ionicons name="create-outline" size={22} color={colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  blur: {
    height: 44,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  spacer: {
    flex: 1,
  },
  countText: {
    fontSize: 13,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});
