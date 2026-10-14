import * as Notifications from 'expo-notifications';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import { exportBackup, importBackup } from './backup';
import { addDays, fmtDateTime, todayStr } from './dates';
import { incrementCompleted, decrementCompleted, incrementCreated } from './stats';
import { deleteImageFile } from './images';
import {
  ACTION_DONE,
  ACTION_SNOOZE,
  cancelIds,
  ensurePermission,
  scheduleTask,
  setupNotifications,
} from './notifications';
import { loadPref, loadTasks, savePref, saveTasks } from './storage';
import { uid, type Repeat, type SortMode, type Task, type TaskImage, type View } from './types';

export interface SnackMsg {
  id: number;
  text: string;
  actionText?: string;
  onAction?: () => void;
}

interface Store {
  loaded: boolean;
  tasks: Task[];
  view: View;
  tag: string | null;
  search: string;
  sort: SortMode;
  selectedId: string | null;
  snack: SnackMsg | null;
  bulkIds: Set<string>;
  bulkMode: boolean;
  setView: (v: View) => void;
  setTag: (t: string | null) => void;
  setSearch: (s: string) => void;
  setSort: (s: SortMode) => void;
  open: (id: string | null) => void;
  addTask: (title: string) => void;
  duplicateTask: (id: string) => void;
  update: (id: string, fn: (t: Task) => Partial<Task>, reschedule?: boolean) => void;
  toggleComplete: (id: string, value?: boolean) => void;
  remove: (id: string) => void;
  setReminder: (id: string, at: number | null, repeat?: Repeat) => Promise<void>;
  snooze: (id: string, minutes: number) => void;
  addImages: (id: string, imgs: TaskImage[]) => void;
  removeImage: (id: string, imageId: string) => void;
  reorder: (orderedIds: string[]) => void;
  enterBulk: (id: string) => void;
  toggleBulk: (id: string) => void;
  exitBulk: () => void;
  bulkComplete: () => void;
  bulkDelete: () => void;
  doExport: () => void;
  doImport: () => void;
  showSnack: (text: string, actionText?: string, onAction?: () => void) => void;
  hideSnack: () => void;
}

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const anim = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setViewState] = useState<View>('all');
  const [tag, setTagState] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSortState] = useState<SortMode>('due');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snack, setSnack] = useState<SnackMsg | null>(null);
  const [bulkIds, setBulkIds] = useState<Set<string>>(new Set());
  const bulkMode = bulkIds.size > 0;
  const tasksRef = useRef<Task[]>([]);
  tasksRef.current = tasks;
  const viewRef = useRef(view);
  viewRef.current = view;
  const tagRef = useRef(tag);
  tagRef.current = tag;

  // ---------- Yükle / kaydet ----------
  useEffect(() => {
    (async () => {
      await setupNotifications();
      const [list, s] = await Promise.all([loadTasks(), loadPref<SortMode>('sort')]);
      setTasks(list);
      if (s) setSortState(s);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => saveTasks(tasks).catch(() => {}), 300);
    return () => clearTimeout(t);
  }, [tasks, loaded]);

  useEffect(() => {
    if (!loaded) return;
    const pending = tasks.filter((t) => !t.completed).length;
    Notifications.setBadgeCountAsync(pending).catch(() => {});
  }, [tasks, loaded]);

  // ---------- Yardımcılar ----------
  const mutate = useCallback((id: string, fn: (t: Task) => Partial<Task>) => {
    let result: Task | null = null;
    const next = tasksRef.current.map((t) => {
      if (t.id !== id) return t;
      result = { ...t, ...fn(t), updatedAt: Date.now() };
      return result;
    });
    tasksRef.current = next;
    setTasks(next);
    return result as Task | null;
  }, []);

  // Eski bildirimleri iptal edip yenilerini planlar
  const reschedule = useCallback(
    async (id: string) => {
      const t = tasksRef.current.find((x) => x.id === id);
      if (!t) return;
      if (t.reminder?.notificationIds.length) await cancelIds(t.reminder.notificationIds);
      const ids = await scheduleTask(t);
      mutate(id, (cur) => (cur.reminder ? { reminder: { ...cur.reminder, notificationIds: ids } } : {}));
    },
    [mutate],
  );

  const showSnack = useCallback((text: string, actionText?: string, onAction?: () => void) => {
    setSnack({ id: Date.now(), text, actionText, onAction });
  }, []);

  // ---------- Eylemler ----------
  const addTask = useCallback((title: string) => {
    const now = Date.now();
    const t: Task = {
      id: uid('t'),
      title,
      notes: '',
      priority: 1,
      tags: tagRef.current ? [tagRef.current] : [],
      dueDate: viewRef.current === 'today' ? todayStr() : viewRef.current === 'upcoming' ? addDays(todayStr(), 1) : null,
      dueTime: null,
      order: now,
      reminder: null,
      subtasks: [],
      images: [],
      completed: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    anim();
    const next = [...tasksRef.current, t];
    tasksRef.current = next;
    setTasks(next);
    if (viewRef.current === 'done' || viewRef.current === 'overdue') setViewState('all');
    incrementCreated();
  }, []);

  const duplicateTask = useCallback((id: string) => {
    const source = tasksRef.current.find((x) => x.id === id);
    if (!source) return;
    const now = Date.now();
    const copy: Task = {
      ...source,
      id: uid('t'),
      reminder: null,
      completed: false,
      completedAt: null,
      order: now,
      createdAt: now,
      updatedAt: now,
      subtasks: source.subtasks.map((s) => ({ ...s, id: uid('s'), done: false })),
      images: [...source.images],
    };
    const next = [...tasksRef.current, copy];
    tasksRef.current = next;
    setTasks(next);
    setSelectedId(copy.id);
    showSnack('Görev çoğaltıldı');
  }, [showSnack]);

  const update = useCallback(
    (id: string, fn: (t: Task) => Partial<Task>, resched = false) => {
      mutate(id, fn);
      if (resched) reschedule(id);
    },
    [mutate, reschedule],
  );

  const toggleComplete = useCallback(
    (id: string, value?: boolean) => {
      anim();
      const t = mutate(id, (cur) => {
        const done = value ?? !cur.completed;
        return { completed: done, completedAt: done ? Date.now() : null };
      });
      if (!t) return;
      reschedule(id);
      if (t.completed) {
        incrementCompleted();
        showSnack('Görev tamamlandı 👍', 'Geri al', () => toggleComplete(id, false));
      } else {
        decrementCompleted();
      }
    },
    [mutate, reschedule, showSnack],
  );

  const remove = useCallback(
    (id: string) => {
      const t = tasksRef.current.find((x) => x.id === id);
      if (!t) return;
      if (t.reminder?.notificationIds.length) cancelIds(t.reminder.notificationIds);
      anim();
      const next = tasksRef.current.filter((x) => x.id !== id);
      tasksRef.current = next;
      setTasks(next);
      setSelectedId((s) => (s === id ? null : s));
      let undone = false;
      // Geri alma süresi bitince resim dosyalarını sil
      setTimeout(() => {
        if (!undone) t.images.forEach(deleteImageFile);
      }, 6000);
      showSnack('Görev silindi', 'Geri al', () => {
        undone = true;
        const restored = [...tasksRef.current, t];
        tasksRef.current = restored;
        setTasks(restored);
        reschedule(t.id);
      });
    },
    [reschedule, showSnack],
  );

  const setReminder = useCallback(
    async (id: string, at: number | null, repeat?: Repeat) => {
      const t = tasksRef.current.find((x) => x.id === id);
      if (!t) return;
      if (t.reminder?.notificationIds.length) await cancelIds(t.reminder.notificationIds);
      if (at == null) {
        mutate(id, () => ({ reminder: null }));
        return;
      }
      const granted = await ensurePermission();
      if (!granted) {
        Alert.alert('Bildirim izni kapalı', 'Hatırlatıcıların çalması için telefon ayarlarından bu uygulamaya bildirim izni ver.');
      }
      const rep = repeat ?? t.reminder?.repeat ?? 'none';
      mutate(id, () => ({ reminder: { at, repeat: rep, notificationIds: [] } }));
      if (rep === 'none' && at <= Date.now()) showSnack('Geçmiş bir zaman seçildi, bildirim gelmeyecek.');
      await reschedule(id);
    },
    [mutate, reschedule, showSnack],
  );

  const snooze = useCallback(
    (id: string, minutes: number) => {
      const at = Date.now() + minutes * 60_000;
      const t = mutate(id, (cur) => ({
        reminder: { ...(cur.reminder ?? { at, repeat: 'none' as Repeat, notificationIds: [] }), snoozeAt: at },
      }));
      if (!t) return;
      reschedule(id);
      showSnack('Ertelendi: ' + fmtDateTime(at));
    },
    [mutate, reschedule, showSnack],
  );

  const addImages = useCallback(
    (id: string, imgs: TaskImage[]) => {
      if (!imgs.length) return;
      mutate(id, (t) => ({ images: [...t.images, ...imgs] }));
      showSnack(imgs.length === 1 ? 'Resim eklendi' : `${imgs.length} resim eklendi`);
    },
    [mutate, showSnack],
  );

  const removeImage = useCallback(
    (id: string, imageId: string) => {
      const t = tasksRef.current.find((x) => x.id === id);
      const img = t?.images.find((i) => i.id === imageId);
      if (!img) return;
      mutate(id, (cur) => ({ images: cur.images.filter((i) => i.id !== imageId) }));
      deleteImageFile(img);
    },
    [mutate],
  );

  const enterBulk = useCallback((id: string) => {
    setBulkIds(new Set([id]));
  }, []);

  const toggleBulk = useCallback((id: string) => {
    setBulkIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const exitBulk = useCallback(() => setBulkIds(new Set()), []);

  const bulkComplete = useCallback(() => {
    anim();
    const ids = [...bulkIds];
    const next = tasksRef.current.map((t) => {
      if (!ids.includes(t.id)) return t;
      return { ...t, completed: true, completedAt: Date.now(), updatedAt: Date.now() };
    });
    tasksRef.current = next;
    setTasks(next);
    ids.forEach((id) => reschedule(id));
    ids.forEach(() => incrementCompleted());
    showSnack(`${ids.length} görev tamamlandı`);
    setBulkIds(new Set());
  }, [bulkIds, reschedule, showSnack]);

  const bulkDelete = useCallback(() => {
    anim();
    const ids = new Set(bulkIds);
    const removed = tasksRef.current.filter((t) => ids.has(t.id));
    removed.forEach((t) => { if (t.reminder?.notificationIds.length) cancelIds(t.reminder.notificationIds); });
    const next = tasksRef.current.filter((t) => !ids.has(t.id));
    tasksRef.current = next;
    setTasks(next);
    setSelectedId((s) => (s && ids.has(s) ? null : s));
    showSnack(`${ids.size} görev silindi`, 'Geri al', () => {
      const restored = [...tasksRef.current, ...removed];
      tasksRef.current = restored;
      setTasks(restored);
      removed.forEach((t) => { if (t.reminder && !t.completed) reschedule(t.id); });
    });
    setBulkIds(new Set());
  }, [bulkIds, reschedule, showSnack]);

  const reorder = useCallback((orderedIds: string[]) => {
    const now = Date.now();
    const next = tasksRef.current.map((t) => {
      const idx = orderedIds.indexOf(t.id);
      if (idx < 0) return t;
      return { ...t, order: now + idx, updatedAt: Date.now() };
    });
    tasksRef.current = next;
    setTasks(next);
  }, []);

  // ---------- Yedekleme ----------
  const doExport = useCallback(async () => {
    const result = await exportBackup(tasksRef.current);
    if (result) showSnack(`Yedek hazırlandı (${result.count} görev, ${result.imgCount} resim)`);
  }, [showSnack]);

  const doImport = useCallback(async () => {
    const result = await importBackup();
    if (!result) return;
    const existingIds = new Set(tasksRef.current.map((t) => t.id));
    const merged = [...tasksRef.current];
    for (const imported of result.tasks) {
      const newUri = (imgId: string) => result.restoredImages.get(imgId);
      const updated: Task = {
        ...imported,
        images: imported.images.map((img) => ({ ...img, uri: newUri(img.id) ?? img.uri })),
      };
      const idx = merged.findIndex((t) => t.id === imported.id);
      if (idx >= 0) merged[idx] = updated;
      else merged.push(updated);
    }
    tasksRef.current = merged;
    setTasks(merged);
    for (const t of merged) {
      if (t.reminder && !t.completed) reschedule(t.id);
    }
    showSnack(`Yedek içe aktarıldı (${result.tasks.length} görev)`);
  }, [reschedule, showSnack]);

  // ---------- Bildirim yanıtları (dokunma, ertele, tamamla) ----------
  const handled = useRef(new Set<string>());
  useEffect(() => {
    if (!loaded) return;
    const handle = (resp: Notifications.NotificationResponse | null) => {
      if (!resp) return;
      const key = resp.notification.request.identifier + ':' + resp.notification.date + ':' + resp.actionIdentifier;
      if (handled.current.has(key)) return;
      handled.current.add(key);
      const taskId = resp.notification.request.content.data?.taskId as string | undefined;
      if (!taskId || !tasksRef.current.some((t) => t.id === taskId)) return;
      if (resp.actionIdentifier === ACTION_SNOOZE) snooze(taskId, 10);
      else if (resp.actionIdentifier === ACTION_DONE) toggleComplete(taskId, true);
      else setSelectedId(taskId);
      try {
        Notifications.clearLastNotificationResponse();
      } catch {
        /* web'de desteklenmez */
      }
    };
    try {
      // Uygulama bir bildirime dokunularak açıldıysa onu işle
      handle(Notifications.getLastNotificationResponse());
    } catch {
      /* web'de desteklenmez */
    }
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
  }, [loaded, snooze, toggleComplete]);

  const value = useMemo<Store>(
    () => ({
      loaded,
      tasks,
      view,
      tag,
      search,
      sort,
      selectedId,
      snack,
      bulkIds,
      bulkMode,
      setView: (v) => {
        setViewState(v);
        setTagState(null);
      },
      setTag: (t) => {
        setTagState(t);
        if (t && viewRef.current === 'done') setViewState('all');
      },
      setSearch,
      setSort: (s) => {
        setSortState(s);
        savePref('sort', s);
      },
      open: setSelectedId,
      addTask,
      duplicateTask,
      update,
      toggleComplete,
      remove,
      setReminder,
      snooze,
      addImages,
      removeImage,
      reorder,
      enterBulk,
      toggleBulk,
      exitBulk,
      bulkComplete,
      bulkDelete,
      doExport,
      doImport,
      showSnack,
      hideSnack: () => setSnack(null),
    }),
    [loaded, tasks, view, tag, search, sort, selectedId, snack, bulkIds, bulkMode, addTask, duplicateTask, update, toggleComplete, remove, setReminder, snooze, addImages, removeImage, reorder, enterBulk, toggleBulk, exitBulk, bulkComplete, bulkDelete, doExport, doImport, showSnack],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('StoreProvider eksik');
  return v;
}
