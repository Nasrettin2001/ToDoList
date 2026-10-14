import { dateStr } from './dates';
import { loadStats, saveStats, type WeeklyStats } from './storage';

function mondayOfWeek(d: Date): string {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const mon = new Date(d);
  mon.setDate(mon.getDate() + diff);
  return dateStr(mon);
}

export async function getOrCreateWeekStats(): Promise<WeeklyStats> {
  const currentWeek = mondayOfWeek(new Date());
  const existing = await loadStats();
  if (existing && existing.weekStart === currentWeek) return existing;
  const fresh: WeeklyStats = { weekStart: currentWeek, completed: 0, created: 0 };
  await saveStats(fresh);
  return fresh;
}

export async function incrementCompleted(): Promise<WeeklyStats> {
  const stats = await getOrCreateWeekStats();
  stats.completed++;
  await saveStats(stats);
  return stats;
}

export async function decrementCompleted(): Promise<WeeklyStats> {
  const stats = await getOrCreateWeekStats();
  if (stats.completed > 0) stats.completed--;
  await saveStats(stats);
  return stats;
}

export async function incrementCreated(): Promise<WeeklyStats> {
  const stats = await getOrCreateWeekStats();
  stats.created++;
  await saveStats(stats);
  return stats;
}
