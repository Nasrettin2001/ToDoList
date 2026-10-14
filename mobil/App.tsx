import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterBar } from './src/components/FilterBar';
import { Onboarding } from './src/components/Onboarding';
import { QuickAdd } from './src/components/QuickAdd';
import { StatsCard } from './src/components/StatsCard';
import { Snackbar } from './src/components/Snackbar';
import { TaskDetail } from './src/components/TaskDetail';
import { TaskRow } from './src/components/TaskRow';
import { inView, matchesSearch, sortTasks } from './src/filters';
import { StoreProvider, useStore } from './src/store';
import { ThemeProvider, useTheme } from './src/theme';
import { loadPref, savePref } from './src/storage';
import { VIEW_NAMES, type SortMode, type View as ViewName } from './src/types';

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

const SORT_LABELS: Record<SortMode, string> = { due: 'Son tarihe göre', priority: 'Önceliğe göre', created: 'Eklenme sırasına göre', manual: 'Manuel sıralama' };
const SORT_ORDER: SortMode[] = ['due', 'priority', 'created', 'manual'];
const EMPTY: Record<ViewName, string> = {
  today: 'Bugün için görev yok. Keyfine bak ☕',
  upcoming: 'Önümüzdeki 7 gün boş görünüyor.',
  overdue: 'Geciken görev yok, harika! 🎉',
  all: 'Henüz görev yok.\nAşağıdan ilk görevini ekle.',
  done: 'Tamamlanan görev yok.',
};

function Home() {
  const { c, dark, toggle } = useTheme();
  const insets = useSafeAreaInsets();
  const s = useStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    loadPref('onboarding').then((v) => setShowOnboarding(v !== 'done'));
  }, []);

  const visible = useMemo(
    () => sortTasks(s.tasks.filter((t) => inView(t, s.view) && (!s.tag || t.tags.includes(s.tag)) && matchesSearch(t, s.search)), s.sort, s.view),
    [s.tasks, s.view, s.tag, s.search, s.sort],
  );

  const cycleSort = () => {
    const next = SORT_ORDER[(SORT_ORDER.indexOf(s.sort) + 1) % SORT_ORDER.length];
    s.setSort(next);
    s.showSnack('Sıralama: ' + SORT_LABELS[next]);
  };

  const emptyText = s.search ? 'Aramayla eşleşen görev yok.' : s.tag ? 'Bu etikette görev yok.' : EMPTY[s.view];

  if (showOnboarding) {
    return (
      <Onboarding onDone={() => { savePref('onboarding', 'done'); setShowOnboarding(false); }} />
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: c.bg }]}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <View style={[styles.header, { paddingTop: insets.top + 6, backgroundColor: s.bulkMode ? c.accent : c.surface, borderBottomColor: c.border }]}>
        {s.bulkMode ? (
          <View style={styles.titleRow}>
            <HeaderBtn name="close" onPress={s.exitBulk} label="İptal" />
            <Text style={[styles.appTitle, { color: c.onAccent }]}>{s.bulkIds.size} seçildi</Text>
            <HeaderBtn name="checkmark-done" onPress={s.bulkComplete} label="Tamamla" />
            <HeaderBtn name="trash-outline" onPress={() => {
              Alert.alert(`${s.bulkIds.size} görev silinsin mi?`, '', [
                { text: 'Vazgeç', style: 'cancel' },
                { text: 'Sil', style: 'destructive', onPress: s.bulkDelete },
              ]);
            }} label="Sil" />
          </View>
        ) : (
        <View style={styles.titleRow}>
          <View style={[styles.logo, { backgroundColor: c.accent }]}>
            <Ionicons name="checkmark" size={18} color={c.onAccent} />
          </View>
          <Text style={[styles.appTitle, { color: c.text }]}>İş Listesi</Text>
          <HeaderBtn
            name={searchOpen ? 'search' : 'search-outline'}
            onPress={() => {
              if (searchOpen) s.setSearch('');
              setSearchOpen(!searchOpen);
            }}
            label="Ara"
          />
          <HeaderBtn name="swap-vertical" onPress={cycleSort} label="Sırala" />
          <HeaderBtn name={dark ? 'sunny-outline' : 'moon-outline'} onPress={toggle} label="Tema değiştir" />
          <HeaderBtn name="ellipsis-vertical" onPress={() => setMenuOpen(true)} label="Menü" />
        </View>
        )}
        {!s.bulkMode && searchOpen && (
          <TextInput
            autoFocus
            value={s.search}
            onChangeText={s.setSearch}
            placeholder="Başlık, not veya etikette ara…"
            placeholderTextColor={c.muted}
            returnKeyType="search"
            clearButtonMode="while-editing"
            style={[styles.search, { backgroundColor: c.bg, borderColor: c.border, color: c.text }]}
          />
        )}
        <FilterBar />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {!s.loaded ? (
          <ActivityIndicator style={styles.flex} color={c.accent} />
        ) : (
          <FlatList
            data={visible}
            keyExtractor={(t) => t.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <>
                <StatsCard taskCount={s.tasks.length} />
                <Text style={[styles.viewTitle, { color: c.text }]}>
                  {s.tag ? '#' + s.tag : VIEW_NAMES[s.view]}
                  <Text style={{ color: c.muted, fontWeight: '400' }}>  {visible.length}</Text>
                </Text>
              </>
            }
            ListEmptyComponent={<Text style={[styles.empty, { color: c.muted }]}>{emptyText}</Text>}
            renderItem={({ item }) => (
              <TaskRow
                task={item}
                onPress={s.bulkMode ? () => s.toggleBulk(item.id) : () => s.open(item.id)}
                onToggle={s.bulkMode ? () => s.toggleBulk(item.id) : () => s.toggleComplete(item.id)}
                onTagPress={(g) => s.setTag(g)}
                onLongPress={s.bulkMode ? () => s.toggleBulk(item.id) : () => s.enterBulk(item.id)}
                style={s.bulkIds.has(item.id) ? { borderColor: c.accent, borderWidth: 2 } : undefined}
              />
            )}
          />
        )}
        <QuickAdd bottomInset={insets.bottom} />
      </KeyboardAvoidingView>

      <Snackbar bottom={insets.bottom + 80} />
      <TaskDetail />
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menuBox, { backgroundColor: c.surface, borderColor: c.border }]}>
            <MenuItem icon="download-outline" label="Yedeği dışa aktar" onPress={() => { setMenuOpen(false); s.doExport(); }} />
            <MenuItem icon="push-outline" label="Yedeği içe aktar" onPress={() => { setMenuOpen(false); s.doImport(); }} />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function MenuItem({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="menuitem" accessibilityLabel={label} style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: c.surface2 }]}>
      <Ionicons name={icon} size={20} color={c.text} />
      <Text style={{ color: c.text, fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

function HeaderBtn({ name, onPress, label }: { name: keyof typeof Ionicons.glyphMap; onPress: () => void; label: string }) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={4} accessibilityLabel={label} style={({ pressed }) => [styles.headerBtn, pressed && { backgroundColor: c.surface2 }]}>
      <Ionicons name={name} size={22} color={c.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { borderBottomWidth: StyleSheet.hairlineWidth },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 4 },
  logo: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  appTitle: { flex: 1, fontSize: 20, fontWeight: '700' },
  headerBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  search: { marginHorizontal: 16, marginTop: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, minHeight: 44, fontSize: 16 },
  list: { padding: 16, paddingBottom: 40 },
  viewTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  empty: { textAlign: 'center', fontSize: 16, marginTop: 60, lineHeight: 24 },
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 90, paddingRight: 16 },
  menuBox: { borderWidth: 1, borderRadius: 14, paddingVertical: 6, minWidth: 220, elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
});
