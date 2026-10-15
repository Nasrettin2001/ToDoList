import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarView } from './src/components/CalendarView';
import { Onboarding } from './src/components/Onboarding';
import { SegmentBar } from './src/components/SegmentBar';
import { StatsCard } from './src/components/StatsCard';
import { Snackbar } from './src/components/Snackbar';
import { SwipeableRow } from './src/components/SwipeableRow';
import { TaskDetail } from './src/components/TaskDetail';
import { TaskRow } from './src/components/TaskRow';
import { inView, matchesSearch, sortTasks } from './src/filters';
import { StoreProvider, useStore } from './src/store';
import { ThemeProvider, useTheme } from './src/theme';
import { loadPref, savePref } from './src/storage';
import { DEFAULT_LISTS, VIEW_NAMES, type SortMode, type View as ViewName } from './src/types';

type Tab = 'tasks' | 'calendar' | 'lists' | 'settings';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StoreProvider>
          <Home />
        </StoreProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const SORT_LABELS: Record<SortMode, string> = {
  due: 'Son tarihe göre',
  priority: 'Önceliğe göre',
  created: 'Eklenme sırasına göre',
  manual: 'Manuel sıralama',
};
const SORT_ORDER: SortMode[] = ['due', 'priority', 'created', 'manual'];
const VIEWS: ViewName[] = ['today', 'upcoming', 'overdue', 'all', 'done'];
const EMPTY: Record<ViewName, string> = {
  today: 'Bugün için görev yok.\nKeyfine bak ☕',
  upcoming: 'Önümüzdeki 7 günde son tarihi olan görev yok.\nGörev detayından son tarih ekle.',
  overdue: 'Geciken görev yok, harika! 🎉',
  all: 'Henüz görev yok.\n+ butonuna basarak ilk görevini ekle.',
  done: 'Tamamlanan görev yok.',
};

function Home() {
  const { c, dark, toggle } = useTheme();
  const insets = useSafeAreaInsets();
  const s = useStore();
  const [tab, setTab] = useState<Tab>('tasks');
  const [searchOpen, setSearchOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addText, setAddText] = useState('');
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const addInputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadPref('onboarding').then((v) => setShowOnboarding(v !== 'done'));
  }, []);

  const applyListFilter = tab === 'lists';
  const visible = useMemo(
    () =>
      sortTasks(
        s.tasks.filter(
          (t) =>
            inView(t, s.view) &&
            (!s.tag || t.tags.includes(s.tag)) &&
            (!applyListFilter || !s.listFilter || t.listId === s.listFilter) &&
            matchesSearch(t, s.search),
        ),
        s.sort,
        s.view,
      ),
    [s.tasks, s.view, s.tag, s.listFilter, s.search, s.sort, applyListFilter],
  );

  const cycleSort = () => {
    const next = SORT_ORDER[(SORT_ORDER.indexOf(s.sort) + 1) % SORT_ORDER.length];
    s.setSort(next);
    s.showSnack('Sıralama: ' + SORT_LABELS[next]);
  };

  const submitAdd = () => {
    const v = addText.trim();
    if (!v) return;
    s.addTask(v);
    setAddText('');
    setAddModalOpen(false);
  };

  const emptyText = s.search ? 'Aramayla eşleşen görev yok.' : s.tag ? 'Bu etikette görev yok.' : EMPTY[s.view];

  if (showOnboarding) {
    return <Onboarding onDone={() => { savePref('onboarding', 'done'); setShowOnboarding(false); }} />;
  }

  // --- Segment data ---
  const viewSegments = useMemo(() => {
    const segs: { key: string; label: string; count?: number }[] = VIEWS.map((v) => ({
      key: v as string,
      label: VIEW_NAMES[v],
      count: v === 'done' ? undefined : s.tasks.filter((t) => inView(t, v)).length,
    }));
    const tags = [...new Set(s.tasks.flatMap((t) => t.tags))].sort();
    tags.forEach((g) => segs.push({ key: 'tag:' + g, label: '#' + g, count: undefined }));
    return segs;
  }, [s.tasks]);

  const activeViewKey = s.tag ? 'tag:' + s.tag : s.view;
  const onViewSelect = (key: string) => {
    if (key.startsWith('tag:')) {
      const t = key.slice(4);
      s.setTag(s.tag === t ? null : t);
    } else {
      s.setView(key as ViewName);
      s.setTag(null);
    }
  };

  const listSegments = useMemo(() => {
    const all = s.tasks.filter((t) => !t.completed);
    return [
      { key: '_all', label: 'Tümü', count: all.length },
      ...DEFAULT_LISTS.map((l) => ({
        key: l.id,
        label: l.name,
        color: l.color,
        count: all.filter((t) => t.listId === l.id).length,
      })),
    ];
  }, [s.tasks]);

  const activeListKey = s.listFilter ?? '_all';
  const onListSelect = (key: string) => {
    s.setListFilter(key === '_all' ? null : key === s.listFilter ? null : key);
  };

  // --- Sub-header segment bar (fixed 44px height for all tabs) ---
  const renderSubHeader = () => {
    switch (tab) {
      case 'tasks':
        return <SegmentBar segments={viewSegments} activeKey={activeViewKey} onSelect={onViewSelect} />;
      case 'lists':
        return <SegmentBar segments={listSegments} activeKey={activeListKey} onSelect={onListSelect} />;
      case 'calendar':
      case 'settings':
        return <View style={[styles.subHeaderPlaceholder, { borderBottomColor: c.border }]} />;
    }
  };

  // --- Header ---
  const renderHeader = () => {
    if (s.bulkMode) {
      return (
        <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.accent }]}>
          <View style={styles.headerRow}>
            <Pressable onPress={s.exitBulk} style={styles.headerIcon}>
              <Ionicons name="close" size={24} color={c.onAccent} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: c.onAccent }]}>{s.bulkIds.size} seçildi</Text>
            <Pressable onPress={s.bulkComplete} style={styles.headerIcon}>
              <Ionicons name="checkmark-done" size={24} color={c.onAccent} />
            </Pressable>
            <Pressable
              onPress={() => Alert.alert(`${s.bulkIds.size} görev silinsin mi?`, '', [
                { text: 'Vazgeç', style: 'cancel' },
                { text: 'Sil', style: 'destructive', onPress: s.bulkDelete },
              ])}
              style={styles.headerIcon}
            >
              <Ionicons name="trash-outline" size={24} color={c.onAccent} />
            </Pressable>
          </View>
        </View>
      );
    }

    const titles: Record<Tab, string> = {
      tasks: 'İş Listesi',
      calendar: 'Takvim',
      lists: 'Listeler',
      settings: 'Ayarlar',
    };

    return (
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.bg }]}>
        <View style={styles.headerRow}>
          <View style={[styles.logoBox, { backgroundColor: c.accent }]}>
            <Ionicons name="checkmark" size={16} color={c.onAccent} />
          </View>
          <Text style={[styles.headerTitle, { color: c.text }]}>{titles[tab]}</Text>
          {(tab === 'tasks' || tab === 'lists') && (
            <Pressable
              onPress={() => { if (searchOpen) s.setSearch(''); setSearchOpen(!searchOpen); }}
              style={[styles.headerIcon, searchOpen && { backgroundColor: c.accentSoft }]}
            >
              <Ionicons name="search" size={20} color={searchOpen ? c.accent : c.muted} />
            </Pressable>
          )}
          {(tab === 'tasks' || tab === 'lists') && (
            <Pressable onPress={cycleSort} style={styles.headerIcon}>
              <Ionicons name="swap-vertical" size={20} color={c.muted} />
            </Pressable>
          )}
        </View>
        {searchOpen && (tab === 'tasks' || tab === 'lists') && (
          <View style={[styles.searchWrap, { backgroundColor: c.surface }]}>
            <Ionicons name="search" size={18} color={c.muted} style={{ marginLeft: 12 }} />
            <TextInput
              autoFocus
              value={s.search}
              onChangeText={s.setSearch}
              placeholder="Görev, not veya etiket ara…"
              placeholderTextColor={c.muted}
              returnKeyType="search"
              style={[styles.searchInput, { color: c.text }]}
            />
            {s.search.length > 0 && (
              <Pressable onPress={() => s.setSearch('')} style={{ marginRight: 8 }}>
                <Ionicons name="close-circle" size={18} color={c.muted} />
              </Pressable>
            )}
          </View>
        )}
      </View>
    );
  };

  // --- Tab contents ---
  const renderTaskList = () => (
    <FlatList
      data={visible}
      keyExtractor={(t) => t.id}
      contentContainerStyle={styles.taskList}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <>
          <StatsCard taskCount={s.tasks.length} />
          <Text style={[styles.sectionTitle, { color: c.text }]}>
            {s.tag ? '#' + s.tag : VIEW_NAMES[s.view]}
            <Text style={{ color: c.muted, fontWeight: '400' }}>  {visible.length}</Text>
          </Text>
        </>
      }
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Ionicons name={tab === 'lists' ? 'folder-open-outline' : 'clipboard-outline'} size={48} color={c.border} />
          <Text style={[styles.emptyText, { color: c.muted }]}>
            {tab === 'lists' ? 'Bu listede görev yok.' : emptyText}
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <SwipeableRow
          onSwipeRight={() => s.toggleComplete(item.id)}
          onSwipeLeft={() => s.remove(item.id)}
          enabled={!s.bulkMode}
        >
          <TaskRow
            task={item}
            onPress={s.bulkMode ? () => s.toggleBulk(item.id) : () => s.open(item.id)}
            onToggle={s.bulkMode ? () => s.toggleBulk(item.id) : () => s.toggleComplete(item.id)}
            onTagPress={(g) => s.setTag(g)}
            onLongPress={s.bulkMode ? () => s.toggleBulk(item.id) : () => s.enterBulk(item.id)}
            style={s.bulkIds.has(item.id) ? { borderColor: c.accent, borderWidth: 2 } : undefined}
          />
        </SwipeableRow>
      )}
    />
  );

  const renderSettingsTab = () => (
    <ScrollView contentContainerStyle={styles.settingsContent}>
      <View style={[styles.settingsCard, { backgroundColor: c.surface, borderColor: c.border }]}>
        <SettingsItem
          icon="moon-outline"
          label="Karanlık Tema"
          right={
            <Pressable
              onPress={toggle}
              style={[styles.toggle, { backgroundColor: dark ? c.accent : c.surface2 }]}
            >
              <View style={[styles.toggleKnob, { backgroundColor: c.onAccent, transform: [{ translateX: dark ? 20 : 2 }] }]} />
            </Pressable>
          }
        />
        <View style={[styles.divider, { backgroundColor: c.border }]} />
        <SettingsItem
          icon="swap-vertical"
          label={'Sıralama: ' + SORT_LABELS[s.sort]}
          onPress={cycleSort}
        />
      </View>

      <View style={[styles.settingsCard, { backgroundColor: c.surface, borderColor: c.border }]}>
        <SettingsItem icon="download-outline" label="Yedeği dışa aktar" onPress={s.doExport} />
        <View style={[styles.divider, { backgroundColor: c.border }]} />
        <SettingsItem icon="push-outline" label="Yedeği içe aktar" onPress={s.doImport} />
      </View>

      <View style={[styles.settingsCard, { backgroundColor: c.surface, borderColor: c.border }]}>
        <SettingsItem icon="information-circle-outline" label="İş Listesi v1.0" />
        <View style={[styles.divider, { backgroundColor: c.border }]} />
        <SettingsItem icon="stats-chart-outline" label={`Toplam ${s.tasks.length} görev`} />
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.flex, { backgroundColor: c.bg }]}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      {renderHeader()}
      {renderSubHeader()}

      <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 50 : 0}>
        {!s.loaded ? (
          <ActivityIndicator style={styles.flex} color={c.accent} />
        ) : (
          <>
            {tab === 'tasks' && renderTaskList()}
            {tab === 'calendar' && <CalendarView tasks={visible} allTasks={s.tasks} onSelectTask={(id) => s.open(id)} />}
            {tab === 'lists' && renderTaskList()}
            {tab === 'settings' && renderSettingsTab()}
          </>
        )}
      </KeyboardAvoidingView>

      {/* Bottom Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: c.surface, borderTopColor: c.border, paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TabBtn icon="home-outline" activeIcon="home" label="Görevler" active={tab === 'tasks'} onPress={() => setTab('tasks')} />
        <TabBtn icon="calendar-outline" activeIcon="calendar" label="Takvim" active={tab === 'calendar'} onPress={() => setTab('calendar')} />
        <Pressable
          onPress={() => { setAddModalOpen(true); setTimeout(() => addInputRef.current?.focus(), 100); }}
          style={[styles.fabBtn, { backgroundColor: c.accent }]}
        >
          <Ionicons name="add" size={28} color={c.onAccent} />
        </Pressable>
        <TabBtn icon="folder-outline" activeIcon="folder" label="Listeler" active={tab === 'lists'} onPress={() => setTab('lists')} />
        <TabBtn icon="settings-outline" activeIcon="settings" label="Ayarlar" active={tab === 'settings'} onPress={() => setTab('settings')} />
      </View>

      <Snackbar bottom={insets.bottom + 70} />
      <TaskDetail />

      {/* Add Task Modal */}
      <Modal visible={addModalOpen} transparent animationType="slide" onRequestClose={() => setAddModalOpen(false)}>
        <Pressable style={styles.addBackdrop} onPress={() => setAddModalOpen(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Pressable style={[styles.addSheet, { backgroundColor: c.surface, paddingBottom: Math.max(insets.bottom, 16) }]} onPress={() => {}}>
              <View style={[styles.addHandle, { backgroundColor: c.border }]} />
              <Text style={[styles.addTitle, { color: c.text }]}>Yeni Görev</Text>
              <View style={[styles.addInputWrap, { backgroundColor: c.bg, borderColor: c.border }]}>
                <TextInput
                  ref={addInputRef}
                  value={addText}
                  onChangeText={setAddText}
                  onSubmitEditing={submitAdd}
                  returnKeyType="done"
                  placeholder="Görev adını yaz…"
                  placeholderTextColor={c.muted}
                  maxLength={300}
                  autoFocus
                  style={[styles.addInput, { color: c.text }]}
                />
              </View>
              <Pressable
                onPress={submitAdd}
                style={({ pressed }) => [styles.addBtn, { backgroundColor: c.accent, opacity: addText.trim() ? (pressed ? 0.85 : 1) : 0.5 }]}
              >
                <Ionicons name="add-circle" size={22} color={c.onAccent} />
                <Text style={[styles.addBtnText, { color: c.onAccent }]}>Oluştur</Text>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}

function TabBtn({ icon, activeIcon, label, active, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.tabItem} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: active }}>
      <Ionicons name={active ? activeIcon : icon} size={22} color={active ? c.accent : c.muted} />
      <Text style={[styles.tabLabel, { color: active ? c.accent : c.muted }]}>{label}</Text>
    </Pressable>
  );
}

function SettingsItem({ icon, label, onPress, right }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress && !right}
      style={({ pressed }) => [styles.settingsItem, pressed && onPress && { backgroundColor: c.surface2 }]}
    >
      <Ionicons name={icon} size={20} color={c.muted} />
      <Text style={[styles.settingsLabel, { color: c.text }]}>{label}</Text>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={c.muted} /> : null)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  // Header
  header: { paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8 },
  logoBox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '800' },
  headerIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    minHeight: 42,
  },
  searchInput: { flex: 1, fontSize: 15, paddingHorizontal: 8, paddingVertical: 8 },

  // Sub-header placeholder (same height as SegmentBar for tabs without filters)
  subHeaderPlaceholder: {
    height: 50,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  // Task list
  taskList: { paddingHorizontal: 16, paddingBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 12, marginTop: 12 },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { textAlign: 'center', fontSize: 15, lineHeight: 22 },

  // Bottom Tab Bar
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', paddingVertical: 4, minWidth: 56 },
  tabLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  fabBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  // Add modal
  addBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  addSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12 },
  addHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  addTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  addInputWrap: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  addInput: { fontSize: 16, paddingHorizontal: 16, minHeight: 50 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    borderRadius: 14,
    minHeight: 50,
  },
  addBtnText: { fontSize: 16, fontWeight: '700' },

  // Settings
  settingsContent: { padding: 16, gap: 16 },
  settingsCard: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  settingsItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  settingsLabel: { flex: 1, fontSize: 16 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 48 },
  toggle: { width: 44, height: 24, borderRadius: 12, justifyContent: 'center' },
  toggleKnob: { width: 20, height: 20, borderRadius: 10 },
});
