import { matchesSearch, normalizeTag, sortTasks } from '../src/filters';
import type { Task } from '../src/types';

function makeTask(overrides: Partial<Task> = {}): Task {
  const now = Date.now();
  return {
    id: 't_1',
    title: 'Test',
    notes: '',
    priority: 1,
    tags: [],
    dueDate: null,
    dueTime: null,
    order: now,
    reminder: null,
    subtasks: [],
    images: [],
    listId: 'general',
    completed: false,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('matchesSearch', () => {
  it('returns true when query is empty', () => {
    expect(matchesSearch(makeTask(), '')).toBe(true);
  });

  it('matches title case-insensitively', () => {
    expect(matchesSearch(makeTask({ title: 'Toplantı hazırlığı' }), 'toplantı')).toBe(true);
  });

  it('matches tags', () => {
    expect(matchesSearch(makeTask({ tags: ['rapor'] }), 'rapor')).toBe(true);
  });

  it('matches notes', () => {
    expect(matchesSearch(makeTask({ notes: 'detaylı açıklama' }), 'detay')).toBe(true);
  });

  it('matches subtask text', () => {
    expect(matchesSearch(makeTask({ subtasks: [{ id: 's1', text: 'Alışveriş', done: false }] }), 'alış')).toBe(true);
  });

  it('returns false when no match', () => {
    expect(matchesSearch(makeTask({ title: 'Merhaba' }), 'xyz')).toBe(false);
  });
});

describe('normalizeTag', () => {
  it('removes # and lowercases', () => {
    expect(normalizeTag('#Rapor')).toBe('rapor');
  });
  it('replaces spaces with dashes', () => {
    expect(normalizeTag('iş planı')).toBe('iş-planı');
  });
});

describe('sortTasks', () => {
  const a = makeTask({ id: 'a', dueDate: '2026-10-20', priority: 1, createdAt: 100, order: 3 });
  const b = makeTask({ id: 'b', dueDate: '2026-10-15', priority: 3, createdAt: 200, order: 1 });
  const c = makeTask({ id: 'c', dueDate: null, priority: 2, createdAt: 300, order: 2 });

  it('sorts by due date first in due mode', () => {
    const result = sortTasks([a, b, c], 'due', 'all');
    expect(result.map((t) => t.id)).toEqual(['b', 'a', 'c']);
  });

  it('sorts by priority first in priority mode', () => {
    const result = sortTasks([a, b, c], 'priority', 'all');
    expect(result[0].id).toBe('b');
  });

  it('sorts by created desc in created mode', () => {
    const result = sortTasks([a, b, c], 'created', 'all');
    expect(result.map((t) => t.id)).toEqual(['c', 'b', 'a']);
  });

  it('sorts by order asc in manual mode', () => {
    const result = sortTasks([a, b, c], 'manual', 'all');
    expect(result.map((t) => t.id)).toEqual(['b', 'c', 'a']);
  });
});
