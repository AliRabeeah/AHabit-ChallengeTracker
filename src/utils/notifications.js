import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensurePermission() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Reads current permission status without prompting, for display purposes. */
export async function getPermissionStatus() {
  const { status } = await Notifications.getPermissionsAsync();
  return status; // 'granted' | 'denied' | 'undetermined'
}

export async function scheduleReminder(habit) {
  if (!habit.reminderTime) return null;
  const [hour, minute] = habit.reminderTime.split(':').map(Number);

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders-v2', {
      name: 'Habit Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
    });
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: habit.icon ? `${habit.icon} ${habit.name}` : habit.name,
      body: "Time to check off today's habit.",
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'reminders-v2',
    },
  });
  return id;
}

export async function cancelReminder(notificationId) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {
    // already cancelled or invalid id
  }
}

/**
 * Schedules a one-off local notification `seconds` from now, so the
 * Timer screen still alerts the user even if the app is backgrounded
 * or the screen turns off. Returns the notification id so it can be
 * cancelled if the timer is paused/reset/restarted before it fires.
 */
export async function scheduleTimerAlert(seconds, title, body) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('timer-v2', {
      name: 'Timer',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
    });
  }
  const id = await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: 'default' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Math.round(seconds)),
      channelId: 'timer-v2',
    },
  });
  return id;
}

export async function cancelTimerAlert(notificationId) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {
    // already fired or invalid id
  }
}

/**
 * Schedules one or more reminders for a task. For a single (one-off)
 * task, each reminder fires once at the task's due date + the given
 * time. For a recurring task, each reminder repeats daily at that
 * time (recurring tasks may only be due on certain days, but the
 * reminder itself simply repeats daily for simplicity — the app's
 * own due-date logic still only *shows* the task on its actual days).
 * Returns an array of notification ids, parallel to `task.reminders`.
 */
export async function scheduleTaskReminders(task) {
  const reminders = task.reminders || [];
  if (reminders.length === 0) return [];

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('tasks-v1', {
      name: 'Task Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
    });
  }

  const ids = [];
  for (const time of reminders) {
    const [hour, minute] = time.split(':').map(Number);
    let trigger;

    if (task.taskType === 'recurring') {
      trigger = { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: 'tasks-v1' };
    } else {
      const due = task.dueDate ? new Date(task.dueDate + 'T00:00:00') : new Date();
      due.setHours(hour, minute, 0, 0);
      if (due.getTime() <= Date.now()) {
        // Due time already passed today; skip scheduling rather than
        // firing an immediate/backdated notification.
        ids.push(null);
        continue;
      }
      trigger = { type: Notifications.SchedulableTriggerInputTypes.DATE, date: due, channelId: 'tasks-v1' };
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: task.title,
        body: 'Task reminder',
        sound: 'default',
      },
      trigger,
    });
    ids.push(id);
  }
  return ids;
}

export async function cancelTaskReminders(notificationIds) {
  if (!notificationIds) return;
  for (const id of notificationIds) {
    if (!id) continue;
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {
      // already fired or invalid id
    }
  }
}
