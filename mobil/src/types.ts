export type Priority = 0 | 1 | 2 | 3;
export type Repeat = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';
export type View = 'today' | 'upcoming' | 'overdue' | 'all' | 'done';
export type SortMode = 'due' | 'priority' | 'created' | 'manual';

export interface Reminder {
  at: number; // seçilen zaman (epoch ms)
  repeat: Repeat;
  snoozeAt?: number; // ertelenmiş tek seferlik zaman
  firedAt?: number; // en son çaldığı zaman (istatistik için)
  notificationIds: string[];
}

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskImage {
  id: string;
  uri: string;
  width: number;
  height: number;
}

export interface Task {
  id: string;
  title: string;
  notes: string;
  priority: Priority;
  tags: string[];
  dueDate: string | null; // YYYY-MM-DD
  dueTime: string | null; // HH:mm (isteğe bağlı)
  order: number; // manuel sıralama pozisyonu
  reminder: Reminder | null;
  subtasks: Subtask[];
  images: TaskImage[];
  completed: boolean;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export const PRIORITY_NAMES = ['Düşük', 'Normal', 'Yüksek', 'Acil'] as const;
export const REPEAT_NAMES: Record<Repeat, string> = {
  none: 'Tekrar yok',
  daily: 'Her gün',
  weekdays: 'Hafta içi',
  weekly: 'Her hafta',
  monthly: 'Her ay',
};
export const VIEW_NAMES: Record<View, string> = {
  today: 'Bugün',
  upcoming: 'Yaklaşan',
  overdue: 'Gecikmiş',
  all: 'Tümü',
  done: 'Tamamlanan',
};

export function uid(prefix: string): string {
  return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}
