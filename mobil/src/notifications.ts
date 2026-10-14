import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Task } from './types';

const CHANNEL = 'reminders';
export const CATEGORY = 'reminder';
export const ACTION_SNOOZE = 'snooze10';
export const ACTION_DONE = 'done';

// Uygulama açıkken de bildirimi göster
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setupNotifications(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: 'Hatırlatıcılar',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
      });
    }
    await Notifications.setNotificationCategoryAsync(CATEGORY, [
      { identifier: ACTION_SNOOZE, buttonTitle: '10 dk ertele', options: { opensAppToForeground: true } },
      { identifier: ACTION_DONE, buttonTitle: 'Tamamla', options: { opensAppToForeground: true } },
    ]);
  } catch {
    /* bazı ortamlarda kategori desteklenmeyebilir */
  }
}

export async function ensurePermission(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export async function cancelIds(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
}

// Görevin hatırlatıcısını telefon bildirimleri olarak planlar, planlanan kimlikleri döner
export async function scheduleTask(task: Task): Promise<string[]> {
  const r = task.reminder;
  if (!r || task.completed) return [];
  const now = Date.now();
  const content: Notifications.NotificationContentInput = {
    title: '⏰ Hatırlatıcı',
    body: task.title,
    data: { taskId: task.id },
    categoryIdentifier: CATEGORY,
    sound: 'default',
  };
  const channelId = Platform.OS === 'android' ? CHANNEL : undefined;
  const T = Notifications.SchedulableTriggerInputTypes;
  const d = new Date(r.at);
  const hour = d.getHours();
  const minute = d.getMinutes();
  const triggers: Notifications.NotificationTriggerInput[] = [];

  switch (r.repeat) {
    case 'none':
      if (r.at > now) triggers.push({ type: T.DATE, date: r.at, channelId });
      break;
    case 'daily':
      triggers.push({ type: T.DAILY, hour, minute, channelId });
      break;
    case 'weekdays':
      for (const weekday of [2, 3, 4, 5, 6]) triggers.push({ type: T.WEEKLY, weekday, hour, minute, channelId });
      break;
    case 'weekly':
      triggers.push({ type: T.WEEKLY, weekday: d.getDay() + 1, hour, minute, channelId });
      break;
    case 'monthly':
      triggers.push({ type: T.MONTHLY, day: d.getDate(), hour, minute, channelId });
      break;
  }
  if (r.snoozeAt && r.snoozeAt > now) triggers.push({ type: T.DATE, date: r.snoozeAt, channelId });

  const ids: string[] = [];
  for (const trigger of triggers) {
    try {
      ids.push(await Notifications.scheduleNotificationAsync({ content, trigger }));
    } catch {
      /* planlanamayan tetikleyiciyi atla */
    }
  }
  return ids;
}
