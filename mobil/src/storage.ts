import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SortMode, Task } from './types';

const KEYS = {
  tasks: 'isListesi.tasks',
  theme: 'isListesi.theme',
  sort: 'isListesi.sort',
  stats: 'isListesi.stats',
  onboarding: 'isListesi.onboarding',
};

export async function loadTasks(): Promise<Task[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.tasks);
    const list = raw ? (JSON.parse(raw) as Task[]) : [];
    return Array.isArray(list) ? list.map(normalize) : [];
  } catch {
    return [];
  }
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.tasks, JSON.stringify(tasks));
}

export async function loadPref<T extends string>(key: 'theme' | 'sort' | 'onboarding'): Promise<T | null> {
  try {
    return (await AsyncStorage.getItem(KEYS[key])) as T | null;
  } catch {
    return null;
  }
}
export function savePref(key: 'theme' | 'sort' | 'onboarding', value: string): void {
  AsyncStorage.setItem(KEYS[key], value).catch(() => {});
}

export interface WeeklyStats {
  weekStart: string; // YYYY-MM-DD (haftanın Pazartesi'si)
  completed: number;
  created: number;
}

export async function loadStats(): Promise<WeeklyStats | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.stats);
    return raw ? (JSON.parse(raw) as WeeklyStats) : null;
  } catch {
    return null;
  }
}

export async function saveStats(stats: WeeklyStats): Promise<void> {
  await AsyncStorage.setItem(KEYS.stats, JSON.stringify(stats));
}

export type { SortMode };

// Eksik alanları tamamlar (eski/yarım kayıtlar için)
function normalize(t: Partial<Task>): Task {
  const now = Date.now();
  return {
    id: t.id ?? 't_' + now.toString(36),
    title: t.title ?? 'Adsız görev',
    notes: t.notes ?? '',
    priority: t.priority ?? 1,
    tags: Array.isArray(t.tags) ? t.tags : [],
    dueDate: t.dueDate ?? null,
    dueTime: t.dueTime ?? null,
    order: t.order ?? now,
    reminder: t.reminder ? { ...t.reminder, notificationIds: t.reminder.notificationIds ?? [] } : null,
    subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
    images: Array.isArray(t.images) ? t.images : [],
    completed: !!t.completed,
    completedAt: t.completedAt ?? null,
    createdAt: t.createdAt ?? now,
    updatedAt: t.updatedAt ?? now,
  };
}
