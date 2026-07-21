import React from 'react';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getWidgetOpacity,
  getWidgetDayOffset,
  setWidgetDayOffset,
  getFocusHabitId,
  getHeatmapHabitId,
} from '../utils/widgetSettings';
import { loadPomodoroWidgetState } from '../utils/pomodoroWidgetState';
import { toKey } from '../utils/dateUtils';
import TodayWidget from './TodayWidget';
import ProgressWidget from './ProgressWidget';
import HabitFocusWidget from './HabitFocusWidget';
import WeeklyHeatmapWidget from './WeeklyHeatmapWidget';
import QuickAddWidget from './QuickAddWidget';
import PomodoroWidget from './PomodoroWidget';

const HABITS_KEY = 'ahabit_habits_v1';
const LANGUAGE_KEY = 'ahabit_language';

async function loadHabits() {
  const raw = await AsyncStorage.getItem(HABITS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveHabits(habits) {
  await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
}

async function loadLanguage() {
  const raw = await AsyncStorage.getItem(LANGUAGE_KEY);
  return raw === 'ar' ? 'ar' : 'en';
}

async function openApp() {
  try {
    await Linking.openURL('ahabit://');
  } catch (e) {
    // Best effort — some launchers/Android versions restrict opening
    // an activity from a background task even on a genuine tap.
  }
}

/**
 * Sets a habit's status for a date (mirrors HabitContext.setCompletionStatus
 * so every widget stays consistent with the in-app behavior). Returns
 * the updated habits array.
 */
function applyHabitStatus(habits, habitId, dateKey, nextStatus) {
  return habits.map((h) => {
    if (h.id !== habitId) return h;
    const completions = { ...h.completions };
    const current = completions[dateKey] === true ? 'done' : completions[dateKey];
    const clearing = current === nextStatus;

    if (clearing) {
      delete completions[dateKey];
    } else if (nextStatus === 'done' && h.evaluationType && h.evaluationType !== 'yesno') {
      completions[dateKey] = 'done';
    } else {
      completions[dateKey] = nextStatus;
    }

    if (h.evaluationType === 'checklist' && nextStatus === 'done') {
      const allChecked = {};
      for (const item of h.checklistItems || []) {
        allChecked[item.id] = !clearing;
      }
      const checklist = { ...h.checklist, [dateKey]: allChecked };
      return { ...h, completions, checklist };
    }

    return { ...h, completions };
  });
}

async function handleTodayHabits(props) {
  let dayOffset = await getWidgetDayOffset();

  if (props.widgetAction === 'WIDGET_CLICK') {
    const { clickAction, clickActionData } = props;
    if (clickAction === 'PREV_DAY') {
      dayOffset -= 1;
      await setWidgetDayOffset(dayOffset);
    } else if (clickAction === 'NEXT_DAY') {
      dayOffset += 1;
      await setWidgetDayOffset(dayOffset);
    } else if (clickAction === 'OPEN_APP') {
      await openApp();
    } else if (clickAction === 'TOGGLE_DONE' || clickAction === 'TOGGLE_SKIP') {
      const { habitId, dateKey } = clickActionData || {};
      if (habitId && dateKey) {
        const habits = await loadHabits();
        const updated = applyHabitStatus(habits, habitId, dateKey, clickAction === 'TOGGLE_DONE' ? 'done' : 'skipped');
        await saveHabits(updated);
      }
    }
  }

  const freshHabits = await loadHabits();
  const opacity = await getWidgetOpacity();
  const language = await loadLanguage();
  const widgetHeightDp = props.widgetInfo?.height ?? null;

  props.renderWidget(
    <TodayWidget habits={freshHabits} dayOffset={dayOffset} opacity={opacity} language={language} widgetHeightDp={widgetHeightDp} />
  );
}

async function handleProgressRing(props) {
  if (props.widgetAction === 'WIDGET_CLICK' && props.clickAction === 'OPEN_APP') {
    await openApp();
  }
  const habits = await loadHabits();
  const opacity = await getWidgetOpacity();
  props.renderWidget(<ProgressWidget habits={habits} opacity={opacity} />);
}

async function handleHabitFocus(props) {
  const todayKey = toKey(new Date());

  if (props.widgetAction === 'WIDGET_CLICK') {
    const { clickAction, clickActionData } = props;
    if (clickAction === 'FOCUS_OPEN_APP' || clickAction === 'OPEN_APP') {
      await openApp();
    } else if (clickAction === 'FOCUS_TOGGLE_DONE') {
      const focusId = await getFocusHabitId();
      if (focusId) {
        const habits = await loadHabits();
        const updated = applyHabitStatus(habits, focusId, todayKey, 'done');
        await saveHabits(updated);
      }
    }
  }

  const focusId = await getFocusHabitId();
  const habits = await loadHabits();
  const habit = focusId ? habits.find((h) => h.id === focusId && !h.archived) : null;
  const opacity = await getWidgetOpacity();
  props.renderWidget(<HabitFocusWidget habit={habit} opacity={opacity} />);
}

async function handleWeeklyHeatmap(props) {
  const todayKey = toKey(new Date());

  if (props.widgetAction === 'WIDGET_CLICK') {
    const { clickAction } = props;
    if (clickAction === 'OPEN_APP') {
      await openApp();
    } else if (clickAction === 'HEATMAP_TOGGLE_DONE') {
      const heatmapId = await getHeatmapHabitId();
      if (heatmapId) {
        const habits = await loadHabits();
        const updated = applyHabitStatus(habits, heatmapId, todayKey, 'done');
        await saveHabits(updated);
      }
    }
  }

  const heatmapId = await getHeatmapHabitId();
  const habits = await loadHabits();
  const habit = heatmapId ? habits.find((h) => h.id === heatmapId && !h.archived) : null;
  const opacity = await getWidgetOpacity();
  props.renderWidget(<WeeklyHeatmapWidget habit={habit} opacity={opacity} />);
}

async function handleQuickAdd(props) {
  if (props.widgetAction === 'WIDGET_CLICK' && props.clickAction === 'OPEN_APP') {
    await openApp();
  }
  const opacity = await getWidgetOpacity();
  props.renderWidget(<QuickAddWidget opacity={opacity} />);
}

async function handlePomodoro(props) {
  if (props.widgetAction === 'WIDGET_CLICK' && props.clickAction === 'OPEN_APP') {
    await openApp();
  }
  const state = await loadPomodoroWidgetState();
  const opacity = await getWidgetOpacity();
  props.renderWidget(<PomodoroWidget state={state} opacity={opacity} />);
}

/**
 * Registered in index.js via registerWidgetTaskHandler(). Android calls
 * this in a headless JS context (no app UI running) whenever any of
 * AHabit's widgets is added, needs a periodic refresh, or is tapped.
 * Routes to the right per-widget handler based on which widget it is.
 */
export async function widgetTaskHandler(props) {
  const widgetName = props.widgetInfo?.widgetName;

  switch (widgetName) {
    case 'ProgressRing':
      return handleProgressRing(props);
    case 'HabitFocus':
      return handleHabitFocus(props);
    case 'WeeklyHeatmap':
      return handleWeeklyHeatmap(props);
    case 'QuickAdd':
      return handleQuickAdd(props);
    case 'PomodoroTimer':
      return handlePomodoro(props);
    case 'TodayHabits':
    default:
      return handleTodayHabits(props);
  }
}
