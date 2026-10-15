import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { dateStr } from '../dates';
import { useTheme } from '../theme';
import { DEFAULT_LISTS, type Task } from '../types';
import { TaskRow } from './TaskRow';

interface Props {
  tasks: Task[];
  allTasks: Task[];
  onSelectTask: (id: string) => void;
}

const DAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function getMonthDays(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  let startDay = first.getDay() - 1;
  if (startDay < 0) startDay = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dd = String(d).padStart(2, '0');
    const mm = String(month + 1).padStart(2, '0');
    cells.push(`${year}-${mm}-${dd}`);
  }
  return cells;
}

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export function CalendarView({ tasks, allTasks, onSelectTask }: Props) {
  const { c } = useTheme();
  const today = dateStr(new Date());
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(today);

  const cells = useMemo(() => getMonthDays(year, month), [year, month]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of allTasks) {
      if (t.dueDate) {
        const list = map.get(t.dueDate) ?? [];
        list.push(t);
        map.set(t.dueDate, list);
      }
    }
    return map;
  }, [allTasks]);

  const selectedTasks = useMemo(() => {
    if (!selectedDate) return [];
    return (tasksByDate.get(selectedDate) ?? []).sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return b.priority - a.priority;
    });
  }, [selectedDate, tasksByDate]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };
  const goToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelectedDate(today);
  };

  const listColorMap = useMemo(() => {
    const m = new Map<string, string>();
    DEFAULT_LISTS.forEach((l) => m.set(l.id, l.color));
    return m;
  }, []);

  return (
    <View style={styles.flex}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Pressable onPress={prevMonth} hitSlop={10} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={22} color={c.text} />
        </Pressable>
        <Pressable onPress={goToday}>
          <Text style={[styles.monthTitle, { color: c.text }]}>
            {MONTH_NAMES[month]} {year}
          </Text>
        </Pressable>
        <Pressable onPress={nextMonth} hitSlop={10} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={22} color={c.text} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {DAYS_TR.map((d) => (
          <Text key={d} style={[styles.weekDay, { color: c.muted }]}>{d}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((date, i) => {
          if (!date) return <View key={'e' + i} style={styles.cell} />;
          const isToday = date === today;
          const isSelected = date === selectedDate;
          const dayTasks = tasksByDate.get(date);
          const hasTask = !!dayTasks && dayTasks.length > 0;
          const day = parseInt(date.split('-')[2], 10);

          return (
            <Pressable
              key={date}
              onPress={() => setSelectedDate(date === selectedDate ? null : date)}
              style={[
                styles.cell,
                isSelected && { backgroundColor: c.accent, borderRadius: 10 },
                isToday && !isSelected && { backgroundColor: c.accentSoft, borderRadius: 10 },
              ]}
            >
              <Text style={[
                styles.dayNum,
                { color: isSelected ? c.onAccent : isToday ? c.accent : c.text },
              ]}>
                {day}
              </Text>
              {hasTask && (
                <View style={styles.dotRow}>
                  {dayTasks.slice(0, 3).map((t, j) => (
                    <View
                      key={j}
                      style={[
                        styles.dot,
                        {
                          backgroundColor: isSelected
                            ? c.onAccent
                            : t.completed
                              ? c.muted
                              : listColorMap.get(t.listId) ?? c.accent,
                        },
                      ]}
                    />
                  ))}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {selectedDate && (
        <View style={[styles.selectedHeader, { borderTopColor: c.border }]}>
          <Text style={[styles.selectedTitle, { color: c.text }]}>
            {selectedDate === today ? 'Bugün' : new Date(selectedDate + 'T00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}
          </Text>
          <Text style={{ color: c.muted, fontSize: 14 }}>{selectedTasks.length} görev</Text>
        </View>
      )}

      <FlatList
        data={selectedTasks}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.taskList}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          selectedDate ? (
            <Text style={[styles.empty, { color: c.muted }]}>Bu tarihte görev yok.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            onPress={() => onSelectTask(item.id)}
            onToggle={() => {}}
            onTagPress={() => {}}
            onLongPress={() => {}}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { fontSize: 18, fontWeight: '700' },
  weekRow: { flexDirection: 'row', paddingHorizontal: 8, paddingTop: 8 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, paddingBottom: 8 },
  cell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 6,
    minHeight: 44,
  },
  dayNum: { fontSize: 15, fontWeight: '500' },
  dotRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  selectedTitle: { fontSize: 16, fontWeight: '600' },
  taskList: { paddingHorizontal: 16, paddingBottom: 20 },
  empty: { textAlign: 'center', fontSize: 15, marginTop: 20 },
});
