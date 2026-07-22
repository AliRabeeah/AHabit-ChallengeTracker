import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

// iOS Notes-style short time format: "10:42 AM" for today, otherwise a short date
function formatTimestamp(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  const isThisYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString([], {
    month: 'numeric',
    day: 'numeric',
    year: isThisYear ? undefined : '2-digit',
  });
}

export default function NoteRow({ note, onPress, showDivider = true }) {
  const { colors } = useTheme();

  const hasChecklist = (note.checklistItems || []).length > 0;
  const snippet = note.isLocked
    ? 'Locked Note'
    : (note.content || '').replace(/\s+/g, ' ').trim();

  const timestamp = formatTimestamp(note.lastEdited || note.createdAt);

  return (
    <TouchableOpacity activeOpacity={0.6} onPress={onPress} style={[styles.row, { backgroundColor: colors.surface }]}>
      <View style={styles.textCol}>
        <View style={styles.titleLine}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {note.title || 'New Note'}
          </Text>

          {/* Status icon cluster: pin / lock */}
          <View style={styles.statusIcons}>
            {note.isFavorite /* used as "pinned" flag */ && (
              <Ionicons name="pin" size={13} color={colors.textSecondary} style={styles.statusIcon} />
            )}
            {note.isLocked && (
              <Ionicons name="lock-closed" size={13} color={colors.textSecondary} style={styles.statusIcon} />
            )}
          </View>
        </View>

        <View style={styles.subtitleLine}>
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>{timestamp}</Text>

          {hasChecklist && (
            <Ionicons
              name="checkbox-outline"
              size={13}
              color={colors.textSecondary}
              style={styles.checklistIcon}
            />
          )}

          <Text
            style={[styles.snippet, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {'  ' + (snippet || 'No additional text')}
          </Text>
        </View>
      </View>

      {showDivider && (
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    minHeight: 64,
  },
  textCol: {
    flexShrink: 1,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  statusIcons: {
    flexDirection: 'row',
    marginLeft: 6,
  },
  statusIcon: {
    marginLeft: 4,
  },
  subtitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 13,
  },
  checklistIcon: {
    marginLeft: 6,
  },
  snippet: {
    fontSize: 13,
    flexShrink: 1,
  },
  divider: {
    position: 'absolute',
    left: 16,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
});
