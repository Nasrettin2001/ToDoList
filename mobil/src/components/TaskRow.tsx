import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { fmtDateTime, fmtDue } from '../dates';
import { nextReminder } from '../filters';
import { useTheme } from '../theme';
import { PRIORITY_NAMES, type Task } from '../types';

interface Props {
  task: Task;
  onPress: () => void;
  onToggle: () => void;
  onLongPress: () => void;
  onTagPress: (tag: string) => void;
  style?: StyleProp<ViewStyle>;
}

function TaskRowInner({ task: t, onPress, onToggle, onLongPress, onTagPress, style: outerStyle }: Props) {
  const { c, prioColor } = useTheme();
  const due = t.dueDate ? fmtDue(t.dueDate, t.dueTime) : null;
  const rem = nextReminder(t);
  const doneSubs = t.subtasks.filter((s) => s.done).length;
  const meta: { key: string; text: string; color?: string }[] = [];
  if (due) meta.push({ key: 'due', text: '📅 ' + due.text, color: t.completed ? undefined : due.overdue ? c.danger : due.today ? c.accent : undefined });
  if (rem) meta.push({ key: 'rem', text: '🔔 ' + fmtDateTime(rem) + (t.reminder?.repeat !== 'none' ? ' ↻' : '') });
  if (t.priority >= 2) meta.push({ key: 'prio', text: PRIORITY_NAMES[t.priority], color: prioColor(t.priority) });
  if (t.subtasks.length) meta.push({ key: 'sub', text: `☑ ${doneSubs}/${t.subtasks.length}` });
  if (t.images.length) meta.push({ key: 'img', text: '📎 ' + t.images.length });
  if (t.notes.trim()) meta.push({ key: 'note', text: '📝' });

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${t.title}${t.completed ? ', tamamlandı' : ''}`}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: c.surface, borderColor: c.border, borderLeftColor: prioColor(t.priority), opacity: pressed ? 0.85 : 1 },
        outerStyle,
      ]}
    >
      <Pressable onPress={onToggle} hitSlop={10} style={styles.checkWrap} accessibilityRole="checkbox" accessibilityState={{ checked: t.completed }}>
        <View
          style={[
            styles.check,
            { borderColor: t.completed ? c.accent : prioColor(t.priority), backgroundColor: t.completed ? c.accent : 'transparent' },
          ]}
        >
          {t.completed && <Ionicons name="checkmark" size={15} color={c.onAccent} />}
        </View>
      </Pressable>
      <View style={styles.body}>
        <Text style={[styles.title, { color: t.completed ? c.muted : c.text }, t.completed && styles.strike]}>{t.title}</Text>
        {(meta.length > 0 || t.tags.length > 0) && (
          <View style={styles.meta}>
            {meta.map((m) => (
              <Text key={m.key} style={[styles.metaText, { color: m.color ?? c.muted }, m.color ? styles.bold : null]}>
                {m.text}
              </Text>
            ))}
            {t.tags.map((g) => (
              <Text key={'#' + g} onPress={() => onTagPress(g)} style={[styles.tag, { backgroundColor: c.surface2, color: c.muted }]}>
                #{g}
              </Text>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

export const TaskRow = memo(TaskRowInner);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderWidth: 1, borderLeftWidth: 4, borderRadius: 12, paddingVertical: 12, paddingRight: 12, marginBottom: 8 },
  checkWrap: { paddingHorizontal: 12, paddingTop: 1 },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  title: { fontSize: 16, lineHeight: 22 },
  strike: { textDecorationLine: 'line-through' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, alignItems: 'center' },
  metaText: { fontSize: 12.5 },
  bold: { fontWeight: '600' },
  tag: { fontSize: 12.5, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 1, overflow: 'hidden' },
});
