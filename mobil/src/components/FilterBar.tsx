import { ScrollView, StyleSheet, View } from 'react-native';
import { inView } from '../filters';
import { useStore } from '../store';
import { DEFAULT_LISTS, VIEW_NAMES, type View as ViewType } from '../types';
import { Chip } from './Chip';

const VIEWS: ViewType[] = ['today', 'upcoming', 'overdue', 'all', 'done'];

export function FilterBar() {
  const { tasks, view, tag, listFilter, setView, setTag, setListFilter } = useStore();
  const tagCounts = new Map<string, number>();
  tasks.filter((t) => !t.completed).forEach((t) => t.tags.forEach((g) => tagCounts.set(g, (tagCounts.get(g) ?? 0) + 1)));
  const tags = [...tagCounts.keys()].sort((a, b) => a.localeCompare(b, 'tr'));

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bar} keyboardShouldPersistTaps="handled">
        {VIEWS.map((v) => {
          const n = v === 'done' ? 0 : tasks.filter((t) => inView(t, v)).length;
          return <Chip key={v} label={VIEW_NAMES[v] + (n ? ` ${n}` : '')} active={!tag && view === v} onPress={() => setView(v)} />;
        })}
        {tags.map((g) => (
          <Chip key={g} label={'#' + g} active={tag === g} onPress={() => setTag(tag === g ? null : g)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bar} keyboardShouldPersistTaps="handled">
        <Chip label="Tümü" active={!listFilter} onPress={() => setListFilter(null)} />
        {DEFAULT_LISTS.map((l) => (
          <Chip key={l.id} label={l.name} active={listFilter === l.id} color={l.color} onPress={() => setListFilter(listFilter === l.id ? null : l.id)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
});
