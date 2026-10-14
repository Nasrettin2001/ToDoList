import type { Repeat } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

export function dateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function todayStr(): string {
  return dateStr(new Date());
}
export function addDays(str: string, n: number): string {
  const d = parseDay(str);
  d.setDate(d.getDate() + n);
  return dateStr(d);
}
export function parseDay(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function fmtDay(str: string): string {
  const d = parseDay(str);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString('tr-TR', opts);
}

export function fmtTime(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmtDue(due: string, dueTime?: string | null): { text: string; overdue: boolean; today: boolean } {
  const t = todayStr();
  const timeSuffix = dueTime ? ' ' + dueTime : '';
  if (due === t) return { text: 'Bugün' + timeSuffix, overdue: false, today: true };
  if (due === addDays(t, 1)) return { text: 'Yarın' + timeSuffix, overdue: false, today: false };
  if (due < t) return { text: 'Gecikti · ' + fmtDay(due) + timeSuffix, overdue: true, today: false };
  return { text: fmtDay(due) + timeSuffix, overdue: false, today: false };
}

export function fmtDateTime(ms: number): string {
  const day = dateStr(new Date(ms));
  const t = todayStr();
  if (day === t) return 'Bugün ' + fmtTime(ms);
  if (day === addDays(t, 1)) return 'Yarın ' + fmtTime(ms);
  return fmtDay(day) + ' ' + fmtTime(ms);
}

// Tekrar kuralına göre şimdiden sonraki ilk zaman (tekrarsızsa geçmişte kalabilir → null)
export function nextOccurrence(at: number, repeat: Repeat, now = Date.now()): number | null {
  if (at > now) return at;
  if (repeat === 'none') return null;
  const d = new Date(at);
  let guard = 0;
  while (d.getTime() <= now && guard++ < 2000) {
    switch (repeat) {
      case 'daily':
        d.setDate(d.getDate() + 1);
        break;
      case 'weekdays':
        do d.setDate(d.getDate() + 1);
        while (d.getDay() === 0 || d.getDay() === 6);
        break;
      case 'weekly':
        d.setDate(d.getDate() + 7);
        break;
      case 'monthly':
        d.setMonth(d.getMonth() + 1);
        break;
    }
  }
  return d.getTime();
}

export function quickTime(kind: '1h' | 'tomorrow' | 'monday'): number {
  const d = new Date();
  if (kind === '1h') {
    d.setSeconds(0, 0);
    return d.getTime() + 3600_000;
  }
  if (kind === 'tomorrow') d.setDate(d.getDate() + 1);
  else d.setDate(d.getDate() + (((8 - d.getDay()) % 7) || 7));
  d.setHours(9, 0, 0, 0);
  return d.getTime();
}
