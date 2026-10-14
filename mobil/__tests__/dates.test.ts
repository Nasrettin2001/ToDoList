import { addDays, dateStr, fmtDay, fmtTime, nextOccurrence, parseDay } from '../src/dates';

describe('dateStr', () => {
  it('formats date as YYYY-MM-DD', () => {
    expect(dateStr(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(dateStr(new Date(2026, 11, 25))).toBe('2026-12-25');
  });
});

describe('parseDay', () => {
  it('parses YYYY-MM-DD to Date', () => {
    const d = parseDay('2026-03-15');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(15);
  });
});

describe('addDays', () => {
  it('adds positive days', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02');
  });
  it('adds negative days', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('fmtTime', () => {
  it('formats milliseconds to HH:mm', () => {
    const ms = new Date(2026, 5, 1, 14, 5).getTime();
    expect(fmtTime(ms)).toBe('14:05');
  });
});

describe('nextOccurrence', () => {
  it('returns same time if in future', () => {
    const future = Date.now() + 100_000;
    expect(nextOccurrence(future, 'none')).toBe(future);
  });

  it('returns null for past one-time reminder', () => {
    const past = Date.now() - 100_000;
    expect(nextOccurrence(past, 'none')).toBeNull();
  });

  it('advances daily past now', () => {
    const past = Date.now() - 48 * 3600_000;
    const result = nextOccurrence(past, 'daily');
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(Date.now());
  });

  it('skips weekends for weekdays repeat', () => {
    // Friday at noon
    const fri = new Date(2026, 9, 16, 12, 0).getTime();
    const now = fri + 1;
    const result = nextOccurrence(fri, 'weekdays', now);
    expect(result).not.toBeNull();
    const d = new Date(result!);
    expect(d.getDay()).toBe(1); // Monday
  });
});
