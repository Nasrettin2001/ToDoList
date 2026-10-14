import { getOrCreateWeekStats, incrementCompleted, decrementCompleted, incrementCreated } from '../src/stats';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
      setItem: jest.fn((key: string, value: string) => { store[key] = value; return Promise.resolve(); }),
    },
  };
});

describe('stats', () => {
  it('creates fresh stats when none exist', async () => {
    const stats = await getOrCreateWeekStats();
    expect(stats.completed).toBe(0);
    expect(stats.created).toBe(0);
    expect(stats.weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('increments completed count', async () => {
    const s1 = await incrementCompleted();
    expect(s1.completed).toBe(1);
    const s2 = await incrementCompleted();
    expect(s2.completed).toBe(2);
  });

  it('decrements completed count (not below 0)', async () => {
    const fresh = await getOrCreateWeekStats();
    const prev = fresh.completed;
    const s = await decrementCompleted();
    expect(s.completed).toBe(Math.max(prev - 1, 0));
  });

  it('increments created count', async () => {
    const s = await incrementCreated();
    expect(s.created).toBeGreaterThanOrEqual(1);
  });
});
