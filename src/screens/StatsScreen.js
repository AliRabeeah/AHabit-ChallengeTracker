import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useHabits } from '../context/HabitContext';
import { getCurrentStreak, getBestStreak, statusOf } from '../utils/streakUtils';
import { toKey, addDays } from '../utils/dateUtils';

export default function StatsScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { habits: allHabits } = useHabits();
  const habits = allHabits.filter((h) => !h.archived);
  const insets = useSafeAreaInsets();
  const locale = language === 'ar' ? 'ar-EG' : 'en-US';

  const last7 = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), -(6 - i)));
  const dayCompletion = last7.map((date) => {
    const key = toKey(date);
    const total = habits.length || 1;
    const done = habits.filter((h) => statusOf(h, key) === 'done').length;
    return { date, pct: Math.round((done / total) * 100) };
  });

  const sorted = [...habits].sort((a, b) => getCurrentStreak(b) - getCurrentStreak(a));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20 }}>
      <Text style={[styles.title, { color: colors.text }]}>{t('statsTitle')}</Text>

      <Text style={[styles.section, { color: colors.textSecondary }]}>{t('last7Days')}</Text>
      <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.barsRow}>
          {dayCompletion.map((d, i) => (
            <View key={i} style={styles.barCol}>
              <View style={[styles.barTrack, { backgroundColor: colors.surfaceElevated }]}>
                <View style={[styles.barFill, { height: `${d.pct}%`, backgroundColor: colors.primary }]} />
              </View>
              <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                {d.date.toLocaleDateString(locale, { weekday: 'narrow' })}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={[styles.section, { color: colors.textSecondary }]}>{t('leaderboard')}</Text>
      {sorted.length === 0 ? (
        <Text style={{ color: colors.textSecondary }}>{t('noHabitsYet')}</Text>
      ) : (
        sorted.map((h) => (
          <View key={h.id} style={[styles.leaderRow, { borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontSize: 15 }}>{h.icon} {h.name}</Text>
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{t('best')} {getBestStreak(h)}</Text>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>{getCurrentStreak(h)} 🔥</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', marginBottom: 12 },
  section: { fontSize: 12, fontWeight: '700', marginTop: 20, marginBottom: 10, letterSpacing: 0.5 },
  chartCard: { borderWidth: 1, borderRadius: 16, padding: 16 },
  barsRow: { flexDirection: 'row', justifyContent: 'space-between', height: 120 },
  barCol: { alignItems: 'center', flex: 1 },
  barTrack: { width: 18, height: 90, borderRadius: 9, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 9 },
  barLabel: { fontSize: 11, marginTop: 6 },
  leaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
});
