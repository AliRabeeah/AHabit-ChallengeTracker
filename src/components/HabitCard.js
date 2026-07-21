import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { getCurrentStreak, statusOf } from '../utils/streakUtils';
import { toKey } from '../utils/dateUtils';
import { useTapGesture } from '../utils/tapGesture';
import ActionSheet from './ActionSheet';
import ChecklistQuickView from './ChecklistQuickView';

export default function HabitCard({ habit, onDone, onSkip, onIncrement, onArchive, onDelete, onPress, onToggleChecklistItem, date = new Date() }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const todayKey = toKey(date);
  const status = statusOf(habit, todayKey); // 'done' | 'skipped' | null
  const streak = getCurrentStreak(habit);
  const evaluationType = habit.evaluationType || 'yesno';

  let progressText = null;
  let incrementStep = null;
  if (evaluationType === 'numeric') {
    const value = habit.values?.[todayKey] || 0;
    progressText = `${value}/${habit.numericGoal || 0}${habit.numericUnit ? ' ' + habit.numericUnit : ''}`;
    incrementStep = 1;
  } else if (evaluationType === 'timer') {
    const seconds = habit.values?.[todayKey] || 0;
    progressText = `${Math.round(seconds / 60)}/${habit.timerGoalMinutes || 0} min`;
    incrementStep = 300; // +5 min quick add
  } else if (evaluationType === 'checklist') {
    const dayState = habit.checklist?.[todayKey] || {};
    const doneCount = (habit.checklistItems || []).filter((it) => dayState[it.id]).length;
    progressText = `${doneCount}/${(habit.checklistItems || []).length}`;
  }

  const [menuVisible, setMenuVisible] = useState(false);
  const [checklistViewVisible, setChecklistViewVisible] = useState(false);

  const handleSingleTap = () => {
    if (evaluationType === 'checklist') setChecklistViewVisible(true);
    else onDone && onDone();
  };

  const handlePress = useTapGesture({ onSingleTap: handleSingleTap, onDoubleTap: onSkip });
  const handleLongPress = () => setMenuVisible(true);

  const menuActions = [
    { icon: 'play-skip-forward-outline', label: t('skipLabel'), onPress: onSkip },
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
      <View style={[styles.colorDot, { backgroundColor: habit.color }]} />
      <View style={styles.info}>
        <Text
          style={[
            styles.name,
            { color: colors.text, textDecorationLine: status === 'done' ? 'line-through' : 'none' },
          ]}
        >
          {habit.icon} {habit.name}
        </Text>
        {progressText ? (
          <Text style={[styles.streak, { color: colors.textSecondary }]}>{progressText}</Text>
        ) : streak > 0 ? (
          <Text style={[styles.streak, { color: colors.textSecondary }]}>🔥 {t('dayStreak', streak)}</Text>
        ) : null}
      </View>

      {evaluationType !== 'yesno' && evaluationType !== 'checklist' && (
        <TouchableOpacity
          onPress={() => onIncrement && onIncrement(incrementStep)}
          style={[styles.iconBtn, { borderColor: colors.border }]}
        >
          <Ionicons name="add" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      )}

      <View
        style={[
          styles.checkbox,
          { borderColor: status === 'done' ? habit.color : colors.border, backgroundColor: status === 'done' ? habit.color : 'transparent' },
        ]}
      >
        {status === 'done' && <Ionicons name="checkmark" size={18} color={colors.onPrimary} />}
        {status === 'skipped' && <Ionicons name="play-skip-forward" size={14} color={colors.textSecondary} />}
      </View>
    </TouchableOpacity>
    <ActionSheet visible={menuVisible} onClose={() => setMenuVisible(false)} title={habit.name} actions={menuActions} />
    <ChecklistQuickView
      visible={checklistViewVisible}
      onClose={() => setChecklistViewVisible(false)}
      habit={habit}
      date={date}
      onToggleItem={(itemId, checked) => onToggleChecklistItem && onToggleChecklistItem(itemId, checked)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  colorDot: { width: 8, height: 32, borderRadius: 4, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  streak: { fontSize: 12, marginTop: 3 },
  iconBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
