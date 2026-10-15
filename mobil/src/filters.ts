import { addDays, dateStr, nextOccurrence, todayStr } from './dates';
import type { SortMode, Task, View } from './types';

export function nextReminder(t: Task): number | null {
  const r = t.reminder;
  if (!r || t.completed) return null;
  const now = Date.now();
  const times = [nextOccurrence(r.at, r.repeat, now), r.snoozeAt && r.snoozeAt > now ? r.snoozeAt : null].filter(
    (x): x is number => x != null,
  );
  return times.length ? Math.min(...times) : null;
}

function completedToday(t: Task): boolean {
  if (!t.completed || !t.completedAt) return false;
  return dateStr(new Date(t.completedAt)) === todayStr();
}

export function inView(t: Task, view: View): boolean {
  const today = todayStr();
  const rem = nextReminder(t);
  const remDay = rem ? dateStr(new Date(rem)) : null;
  switch (view) {
    case 'done':
      return t.completed;
    case 'all':
      return !t.completed || completedToday(t);
    case 'today':
      return (!t.completed && ((!!t.dueDate && t.dueDate <= today) || remDay === today)) || completedToday(t);
    case 'upcoming': {
      const end = addDays(today, 7);
      const inRange = (d: string | null) => !!d && d > today && d <= end;
      return (!t.completed && (inRange(t.dueDate) || inRange(remDay))) || completedToday(t);
    }
    case 'overdue':
      return !t.completed && !!t.dueDate && t.dueDate < today;
  }
}

const lower = (s: string) => s.toLocaleLowerCase('tr');

export function matchesSearch(t: Task, q: string): boolean {
  if (!q) return true;
  const needle = lower(q.trim());
  return [t.title, t.notes, ...t.tags, ...t.subtasks.map((s) => s.text)].some((s) => lower(s).includes(needle));
}

export function sortTasks(list: Task[], mode: SortMode, view: View): Task[] {
  if (view === 'done') return [...list].sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  if (mode === 'manual') return [...list].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.order - b.order;
  });
  const byDue = (a: Task, b: Task) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999');
  const byPrio = (a: Task, b: Task) => b.priority - a.priority;
  const byCreated = (a: Task, b: Task) => b.createdAt - a.createdAt;
  const chain = mode === 'priority' ? [byPrio, byDue, byCreated] : mode === 'created' ? [byCreated] : [byDue, byPrio, byCreated];
  return [...list].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    for (const f of chain) {
      const r = f(a, b);
      if (r) return r;
    }
    return 0;
  });
}

export function normalizeTag(s: string): string {
  return lower(s.trim().replace(/^#/, '').replace(/\s+/g, '-'));
}
