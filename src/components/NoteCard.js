import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';
import { useTokens } from '../theme/tokens';
import { useLanguage } from '../i18n/LanguageContext';
import AnimatedPressable from './AnimatedPressable';
import ActionSheet from './ActionSheet';

function withAlpha(hex, alpha) {
  if (!hex || hex[0] !== '#') return hex;
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex.slice(0, 7)}${a}`;
}

export default function NoteCard({
  note,
  onPress,
  onToggleLock,
  onToggleFavorite,
  onDelete,
  onSetReminder,
  index = 0,
}) {
  const { colors, mode } = useTheme();
  const tokens = useTokens();
  const { t } = useLanguage();
  const [menuVisible, setMenuVisible] = useState(false);

  const isDark = mode === 'dark';

  // Truncate content preview to 65 characters
  const contentPreview = note.isLocked
    ? t('lockedNote')
    : (note.content || '').substring(0, 65) +
      (note.content?.length > 65 ? '…' : '');

  // Format last edited time
  const lastEditedDate = new Date(note.lastEdited);
  const timeAgo = getTimeAgo(lastEditedDate);

  const menuActions = [
    {
      icon: note.isFavorite ? 'star' : 'star-outline',
      label: note.isFavorite ? t('unpin') : t('pinToTop'),
      onPress: onToggleFavorite,
    },
    {
      icon: note.isLocked ? 'lock-open' : 'lock-closed',
      label: note.isLocked ? t('unlocked') : t('locked'),
      onPress: onToggleLock,
    },
    {
      icon: 'notifications-outline',
      label: 'Set Reminder',
      onPress: onSetReminder,
    },
    {
      icon: 'trash-outline',
      label: t('delete'),
      onPress: onDelete,
      destructive: true,
    },
  ];

  return (
    <>
      <AnimatedPressable
        index={index}
        onPress={onPress}
        onLongPress={() => {
          Haptics.selectionAsync();
          setMenuVisible(true);
        }}
        style={[
          styles.card,
          {
            backgroundColor: isDark ? withAlpha('#FFFFFF', 0.04) : withAlpha('#FFFFFF', 0.65),
            borderColor: isDark ? withAlpha('#FFFFFF', 0.08) : withAlpha('#000000', 0.06),
            borderRadius: tokens.radius.card,
          },
          Platform.OS === 'ios' && tokens.shadow.soft,
          Platform.OS === 'android' && styles.androidShadow,
        ]}
      >
        {/* Top sheen highlight */}
        <View
          style={[
            styles.sheen,
            {
              backgroundColor: isDark
                ? withAlpha('#FFFFFF', 0.04)
                : withAlpha('#FFFFFF', 0.5),
            },
          ]}
        />

        {/* Header: Title + Icons */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, { color: colors.text }]}
              numberOfLines={1}
            >
              {note.title || 'Untitled Note'}
            </Text>
            <View style={styles.iconsRow}>
              {note.isFavorite && (
                <Ionicons
                  name="pin"
                  size={14}
                  color={colors.primary}
                  style={styles.iconSpacing}
                />
              )}
              {note.isLocked && (
                <Ionicons
                  name="lock-closed"
                  size={14}
                  color={colors.danger}
                  style={styles.iconSpacing}
                />
              )}
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setMenuVisible(true);
            }}
            style={styles.moreBtn}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Content Preview */}
        <Text
          style={[styles.preview, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {contentPreview}
        </Text>

        {/* Footer: Timestamp + Metadata */}
        <View style={styles.footer}>
          <View style={styles.metadata}>
            <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
              {timeAgo}
            </Text>
            {note.checklistItems && note.checklistItems.length > 0 && (
              <Ionicons
                name="checkbox-outline"
                size={12}
                color={colors.textSecondary}
                style={[styles.metaIcon, { opacity: 0.35 }]}
              />
            )}
            {note.attachments && note.attachments.length > 0 && (
              <Ionicons
                name="attach-outline"
                size={12}
                color={colors.textSecondary}
                style={[styles.metaIcon, { opacity: 0.35 }]}
              />
            )}
          </View>

          <TouchableOpacity
            onPress={onToggleFavorite}
            style={styles.favoriteBtn}
          >
            <Ionicons
              name={note.isFavorite ? 'star' : 'star-outline'}
              size={14}
              color={note.isFavorite ? colors.primary : isDark ? withAlpha('#FFFFFF', 0.15) : withAlpha('#000000', 0.15)}
            />
          </TouchableOpacity>
        </View>
      </AnimatedPressable>

      <ActionSheet
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        title={note.title || 'Note'}
        actions={menuActions}
      />
    </>
  );
}

function getTimeAgo(date) {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    paddingBottom: 12,
    marginBottom: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  androidShadow: {
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSpacing: {
    marginLeft: 4,
  },
  moreBtn: {
    padding: 2,
    opacity: 0.4,
  },
  preview: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '500',
  },
  metaIcon: {
    marginLeft: 6,
  },
  favoriteBtn: {
    padding: 2,
  },
});
