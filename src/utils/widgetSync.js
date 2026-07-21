import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';
import TodayWidget from '../widgets/TodayWidget';
import ProgressWidget from '../widgets/ProgressWidget';
import HabitFocusWidget from '../widgets/HabitFocusWidget';
import WeeklyHeatmapWidget from '../widgets/WeeklyHeatmapWidget';
import PomodoroWidget from '../widgets/PomodoroWidget';
import { getWidgetOpacity, getWidgetDayOffset, getFocusHabitId, getHeatmapHabitId } from './widgetSettings';
import { loadPomodoroWidgetState } from './pomodoroWidgetState';

const LANGUAGE_KEY = 'ahabit_language';

/**
 * Called after every habit add/update/delete/status-change so every
 * habit-driven home-screen widget updates immediately instead of
 * waiting for Android's periodic refresh interval. Safe to call even
 * if the widget library isn't fully linked yet or the user hasn't
 * added any of these widgets — each update is wrapped so one missing
 * widget instance doesn't stop the others from refreshing.
 */
export async function refreshTodayWidget(habits) {
  const [opacity, dayOffset, storedLang, focusId, heatmapId] = await Promise.all([
    getWidgetOpacity(),
    getWidgetDayOffset(),
    AsyncStorage.getItem(LANGUAGE_KEY),
    getFocusHabitId(),
    getHeatmapHabitId(),
  ]);
  const language = storedLang === 'ar' ? 'ar' : 'en';

  const updates = [
    requestWidgetUpdate({
      widgetName: 'TodayHabits',
      renderWidget: () => <TodayWidget habits={habits} dayOffset={dayOffset} opacity={opacity} language={language} />,
    }),
    requestWidgetUpdate({
      widgetName: 'ProgressRing',
      renderWidget: () => <ProgressWidget habits={habits} opacity={opacity} />,
    }),
    requestWidgetUpdate({
      widgetName: 'HabitFocus',
      renderWidget: () => <HabitFocusWidget habit={habits.find((h) => h.id === focusId && !h.archived) || null} opacity={opacity} />,
    }),
    requestWidgetUpdate({
      widgetName: 'WeeklyHeatmap',
      renderWidget: () => <WeeklyHeatmapWidget habit={habits.find((h) => h.id === heatmapId && !h.archived) || null} opacity={opacity} />,
    }),
  ];

  for (const update of updates) {
    try {
      await update;
    } catch (e) {
      // No instance of this particular widget on the home screen, or
      // library not linked in this build — safe to ignore and move on.
    }
  }
}

/** Called from the Timer screen whenever the Pomodoro state changes. */
export async function refreshPomodoroWidget() {
  try {
    const [state, opacity] = await Promise.all([loadPomodoroWidgetState(), getWidgetOpacity()]);
    await requestWidgetUpdate({
      widgetName: 'PomodoroTimer',
      renderWidget: () => <PomodoroWidget state={state} opacity={opacity} />,
    });
  } catch (e) {
    // No Pomodoro widget on the home screen — safe to ignore.
  }
}
