import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { statusOf, getCurrentStreak } from '../utils/streakUtils';
import { toKey } from '../utils/dateUtils';
import { useTapGesture } from '../utils/tapGesture';
import ActionSheet from './ActionSheet';
import TaskChecklistQuickView from './TaskChecklistQuickView';

const PRIORITY_COLORS = {
  low: '#8E8E93',
  medium: '#FFD60A',
  high: '#FF453A',
  default: null,
};

export default function TaskCard({ task, category, onToggleComplete, onSkip, onArchive, onDelete, onPress, onToggleChecklistItem }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const isRecurring = task.taskType === 'recurring';
  const todayKey = toKey(new Date());
  const status = isRecurring ? statusOf(task, todayKey) : (task.completed ? 'done' : null);
  const streak = isRecurring ? getCurrentStreak(task) : 0;
  const checklistTotal = (task.checklist || []).length;
  const checklistDone = (task.checklist || []).filter((it) => it.done).length;
  const priorityColor = PRIORITY_COLORS[task.priority] || null;

  const [menuVisible, setMenuVisible] = useState(false);
  const [checklistViewVisible, setChecklistViewVisible] = useState(false);
  const hasChecklist = checklistTotal > 0;

  const handleSingleTap = () => {
    if (hasChecklist) setChecklistViewVisible(true);
    else onToggleComplete && onToggleComplete();
  };

  const handlePress = useTapGesture({
    onSingleTap: handleSingleTap,
    onDoubleTap: isRecurring ? onSkip : onToggleComplete, // single tasks just re-toggle on "double tap" too
  });
  const handleLongPress = () => setMenuVisible(true);

  const menuActions = [
    ...(isRecurring ? [{ icon: 'play-skip-forward-outline', label: t('skipLabel'), onPress: onSkip }] : []),
    { icon: 'archive-outline', label: t('archive'), onPress: onArchive },
    { icon: 'eye-outline', label: t('viewDetails'), onPress: onPress },
    { icon: 'trash-outline', label: t('delete'), onPress: onDelete, destructive: true },
  ];

  return (
    <>
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={[styles.colorBar, { backgroundColor: category?.color || colors.textSecondary }]} />
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text, textDecorationLine: status === 'done' ? 'line-through' : 'none' }]}>
          {category?.icon} {task.title}
        </Text>
        <View style={styles.metaRow}>
          {checklistTotal > 0 && (
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {checklistDone}/{checklistTotal}
            </Text>
          )}
          {isRecurring && streak > 0 && (
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>🔥 {t('dayStreak', streak)}</Text>
          )}
          {priorityColor && (
            <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
          )}
        </View>
      </View>

      <View
        style={[
          styles.checkbox,
          { borderColor: status === 'done' ? (category?.color || colors.primary) : colors.border, backgroundColor: status === 'done' ? (category?.color || colors.primary) : 'transparent' },
        ]}
      >
        {status === 'done' && <Ionicons name="checkmark" size={18} color={colors.onPrimary} />}
        {status === 'skipped' && <Ionicons name="play-skip-forward" size={14} color={colors.textSecondary} />}
      </View>
    </TouchableOpacity>
    <ActionSheet visible={menuVisible} onClose={() => setMenuVisible(false)} title={task.title} actions={menuActions} />
    <TaskChecklistQuickView
      visible={checklistViewVisible}
      onClose={() => setChecklistViewVisible(false)}
      task={task}
      category={category}
      onToggleItem={(itemId) => onToggleChecklistItem && onToggleChecklistItem(itemId)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  colorBar: { width: 8, height: 32, borderRadius: 4, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 3 },
  metaText: { fontSize: 12 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
