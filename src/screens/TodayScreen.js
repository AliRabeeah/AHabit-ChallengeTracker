import React, { useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useHabits } from '../context/HabitContext';
import { useTasks } from '../context/TaskContext';
import HabitCard from '../components/HabitCard';
import TaskCard from '../components/TaskCard';
import SideDrawer from '../components/SideDrawer';
import AddOptionsSheet from '../components/AddOptionsSheet';
import { isDueOnDate, statusOf } from '../utils/streakUtils';
import { toKey, addDays } from '../utils/dateUtils';

const DATE_RANGE_DAYS = 15; // days shown before/after today in the strip

function isTaskDueOnDate(task, date) {
  if (task.taskType === 'recurring') return isDueOnDate(task, date);
  const dateKey = toKey(date);
  if (task.dueDate === dateKey) return true;
  // Pending single tasks keep showing on every day after their due date until completed.
  if (task.isPending && !task.completed && task.dueDate && dateKey > task.dueDate) return true;
  return false;
}

export default function TodayScreen({ navigation }) {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { habits, setCompletionStatus, addToValue, logTimerSeconds, setChecklistItem, archiveAllCompletedToday, archiveHabit, deleteHabit } = useHabits();
  const { tasks, categories: taskCategories, toggleSingleTaskComplete, setRecurringTaskStatus, toggleChecklistItem, archiveTask, deleteTask } = useTasks();
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [addMenuVisible, setAddMenuVisible] = useState(false);

  const dateStrip = useMemo(() => {
    const arr = [];
    for (let i = -DATE_RANGE_DAYS; i <= DATE_RANGE_DAYS; i++) arr.push(addDays(new Date(), i));
    return arr;
  }, []);

  const selectedKey = toKey(selectedDate);
  const locale = language === 'ar' ? 'ar-EG' : 'en-US';

  const dueHabits = useMemo(
    () => habits.filter((h) => !h.archived && isDueOnDate(h, selectedDate)),
    [habits, selectedDate]
  );
  const dueTasks = useMemo(
    () => tasks.filter((tk) => !tk.archived && isTaskDueOnDate(tk, selectedDate)),
    [tasks, selectedDate]
  );

  const combinedList = useMemo(
    () => [
      ...dueHabits.map((h) => ({ kind: 'habit', id: `h_${h.id}`, data: h })),
      ...dueTasks.map((tk) => ({ kind: 'task', id: `t_${tk.id}`, data: tk })),
    ],
    [dueHabits, dueTasks]
  );

  const completedCount = useMemo(
    () => dueHabits.filter((h) => statusOf(h, selectedKey) === 'done').length,
    [dueHabits, selectedKey]
  );

  const handleDeleteHabit = (habit) => {
    Alert.alert(t('deleteConfirmTitle'), t('deleteConfirmBody'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => deleteHabit(habit.id) },
    ]);
  };

  const handleDeleteTask = (task) => {
    Alert.alert(t('deleteTaskTitle'), t('deleteTaskBody'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => deleteTask(task.id) },
    ]);
  };

  const handleIncrement = (habit, step) => {
    if (habit.evaluationType === 'timer') logTimerSeconds(habit.id, step, selectedDate);
    else addToValue(habit.id, step, selectedDate);
  };

  const handleArchiveCompleted = () => {
    Alert.alert(t('archiveCompletedTitle'), t('archiveCompletedBody'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('archive'), style: 'destructive', onPress: archiveAllCompletedToday },
    ]);
  };

  const handleAddPress = () => setAddMenuVisible(true);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setDrawerVisible(true)} style={styles.menuBtn}>
            <Ionicons name="menu" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('today')}</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        data={dateStrip}
        keyExtractor={(d) => toKey(d)}
        initialScrollIndex={DATE_RANGE_DAYS}
        getItemLayout={(_, index) => ({ length: 60, offset: 60 * index, index })}
        onScrollToIndexFailed={() => {}}
        contentContainerStyle={{ paddingBottom: 16, gap: 8 }}
        style={{ flexGrow: 0, marginBottom: 12 }}
        renderItem={({ item }) => {
          const isSelected = toKey(item) === selectedKey;
          return (
            <TouchableOpacity onPress={() => setSelectedDate(item)} style={[styles.dateTile, { backgroundColor: isSelected ? colors.primary : colors.surface }]}>
              <Text style={{ color: isSelected ? colors.onPrimary : colors.textSecondary, fontSize: 12 }}>
                {item.toLocaleDateString(locale, { weekday: 'short' })}
              </Text>
              <Text style={{ color: isSelected ? colors.onPrimary : colors.text, fontSize: 18, fontWeight: '800', marginTop: 2 }}>
                {item.getDate()}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {completedCount > 0 && (
        <TouchableOpacity onPress={handleArchiveCompleted} style={styles.archiveRow}>
          <Ionicons name="archive-outline" size={15} color={colors.textSecondary} />
          <Text style={[styles.archiveText, { color: colors.textSecondary }]}>
            {t('archiveCompletedToday', completedCount)}
          </Text>
        </TouchableOpacity>
      )}

      {combinedList.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ color: colors.textSecondary, fontSize: 15 }}>{t('noHabitsToday')}</Text>
          <TouchableOpacity onPress={handleAddPress}>
            <Text style={{ color: colors.primary, marginTop: 8, fontWeight: '600' }}>{t('addFirstHabit')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={combinedList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) =>
            item.kind === 'habit' ? (
              <HabitCard
                habit={item.data}
                date={selectedDate}
                onDone={() => setCompletionStatus(item.data.id, 'done', selectedDate)}
                onSkip={() => setCompletionStatus(item.data.id, 'skipped', selectedDate)}
                onIncrement={(step) => handleIncrement(item.data, step)}
                onArchive={() => archiveHabit(item.data.id)}
                onDelete={() => handleDeleteHabit(item.data)}
                onToggleChecklistItem={(itemId, checked) => setChecklistItem(item.data.id, itemId, checked, selectedDate)}
                onPress={() => navigation.navigate('HabitDetail', { habitId: item.data.id })}
              />
            ) : (
              <TaskCard
                task={item.data}
                category={taskCategories.find((c) => c.id === item.data.categoryId)}
                onToggleComplete={() =>
                  item.data.taskType === 'single'
                    ? toggleSingleTaskComplete(item.data.id)
                    : setRecurringTaskStatus(item.data.id, 'done', selectedDate)
                }
                onSkip={() => setRecurringTaskStatus(item.data.id, 'skipped', selectedDate)}
                onArchive={() => archiveTask(item.data.id)}
                onDelete={() => handleDeleteTask(item.data)}
                onToggleChecklistItem={(itemId) => toggleChecklistItem(item.data.id, itemId)}
                onPress={() => navigation.navigate('TaskDetail', { taskId: item.data.id })}
              />
            )
          }
        />
      )}

      <TouchableOpacity onPress={handleAddPress} style={[styles.fab, { backgroundColor: colors.primary }]}>
        <Ionicons name="add" size={28} color={colors.onPrimary} />
      </TouchableOpacity>

      <SideDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} navigation={navigation} />
      <AddOptionsSheet
        visible={addMenuVisible}
        onClose={() => setAddMenuVisible(false)}
        onSelectHabit={() => navigation.navigate('AddEditHabit')}
        onSelectRecurringTask={() => navigation.navigate('NewTask', { taskType: 'recurring' })}
        onSelectTask={() => navigation.navigate('NewTask', { taskType: 'single' })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuBtn: { padding: 4 },
  title: { fontSize: 26, fontWeight: '800' },
  dateTile: { width: 52, height: 60, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -60 },
  archiveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  archiveText: { fontSize: 12, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});
