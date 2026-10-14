import { loadTasks, saveTasks } from '../src/storage';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
      setItem: jest.fn((key: string, value: string) => { store[key] = value; return Promise.resolve(); }),
      removeItem: jest.fn((key: string) => { delete store[key]; return Promise.resolve(); }),
    },
  };
});

describe('storage', () => {
  it('returns empty array when no data', async () => {
    const tasks = await loadTasks();
    expect(tasks).toEqual([]);
  });

  it('normalizes tasks with missing fields', async () => {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify([{ id: 'old_1', title: 'Eski görev' }]),
    );
    const tasks = await loadTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].notes).toBe('');
    expect(tasks[0].priority).toBe(1);
    expect(tasks[0].tags).toEqual([]);
    expect(tasks[0].dueDate).toBeNull();
    expect(tasks[0].dueTime).toBeNull();
    expect(tasks[0].completed).toBe(false);
    expect(tasks[0].subtasks).toEqual([]);
    expect(tasks[0].images).toEqual([]);
    expect(typeof tasks[0].order).toBe('number');
  });

  it('saves and loads tasks', async () => {
    const task = {
      id: 't_x',
      title: 'Test',
      notes: '',
      priority: 1 as const,
      tags: [] as string[],
      dueDate: null,
      dueTime: null,
      order: 1,
      reminder: null,
      subtasks: [] as { id: string; text: string; done: boolean }[],
      images: [] as { id: string; uri: string; width: number; height: number }[],
      completed: false,
      completedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveTasks([task]);
    const loaded = await loadTasks();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe('t_x');
  });
});
