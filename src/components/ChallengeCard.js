import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { toKey } from '../utils/dateUtils';
import ActionSheet from './ActionSheet';

export default function ChallengeCard({
  challenge,
  onCheckIn,
  onPress,
  onArchive,
  onDelete,
}) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [menuVisible, setMenuVisible] = useState(false);

  // Calculate current day and progress
  const startDate = new Date(challenge.startDate);
  const today = new Date();
  const daysElapsed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  const currentDay = Math.max(1, Math.min(daysElapsed + 1, challenge.durationDays));
  const progressPercent = (currentDay / challenge.durationDays) * 100;

  // Count consecutive days (streak)
  const calculateStreak = () => {
    let streak = 0;
    const date = new Date(today);
    for (let i = 0; i < challenge.durationDays; i++) {
      const key = toKey(date);
      if (challenge.completions?.[key]) {
        streak++;
        date.setDate(date.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = calculateStreak();
  const todayKey = toKey(today);
  const checkedInToday = challenge.completions?.[todayKey];

  // Get next milestone
  const nextMilestone = useMemo(() => {
    return (challenge.milestones || []).find((m) => !m.achieved);
  }, [challenge.milestones]);

  const menuActions = [
    { icon: 'eye-outline', label: t('viewDetails'), onPress: onPress },
    { icon: 'archive-outline', label: t('archive'), onPress: onArchive },
    { icon: 'trash-outline', label: t('delete'), onPress: onDelete, destructive: true },
  ];

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onLongPress={() => setMenuVisible(true)}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        {/* Header: Icon, Name, Status */}
        <View style={styles.header}>
          <View style={[styles.colorDot, { backgroundColor: challenge.color }]} />
          <View style={styles.info}>
            <Text style={[styles.name, { color: colors.text }]}>
              {challenge.icon} {challenge.name}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Day {currentDay}/{challenge.durationDays}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.moreBtn}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressContainer, { backgroundColor: colors.surfaceElevated }]}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: challenge.color, width: `${progressPercent}%` },
            ]}
          />
        </View>

        {/* Footer: Streak, Metrics, Check-in Button */}
        <View style={styles.footer}>
          <View style={styles.stats}>
            {streak > 0 && (
              <Text style={[styles.stat, { color: colors.textSecondary }]}>
                🔥 {streak} {t('dayStreak', streak)}
              </Text>
            )}
            {challenge.metrics?.totalImpact > 0 && (
              <Text style={[styles.stat, { color: colors.textSecondary }]}>
                {challenge.metrics.totalImpact} {challenge.metrics.unit}
              </Text>
            )}
            {nextMilestone && (
              <Text style={[styles.stat, { color: colors.primary }]}>
                {BADGES[nextMilestone.badgeId]?.icon} {nextMilestone.day}d
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={onCheckIn}
            style={[
              styles.checkInBtn,
              {
                backgroundColor: checkedInToday ? challenge.color : colors.surfaceElevated,
                borderColor: challenge.color,
              },
            ]}
          >
            <Ionicons
              name={checkedInToday ? 'checkmark' : 'add'}
              size={18}
              color={checkedInToday ? colors.onPrimary : challenge.color}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      <ActionSheet
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        title={challenge.name}
        actions={menuActions}
      />
    </>
  );
}

// Badge definitions (imported from ChallengeContext)
const BADGES = {
  badge_3d: { icon: '🌱' },
  badge_7d: { icon: '⚔️' },
  badge_14d: { icon: '🛡️' },
  badge_30d: { icon: '👑' },
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorDot: {
    width: 8,
    height: 32,
    borderRadius: 4,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  moreBtn: {
    padding: 4,
  },
  progressContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  stat: {
    fontSize: 12,
    fontWeight: '500',
  },
  checkInBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
