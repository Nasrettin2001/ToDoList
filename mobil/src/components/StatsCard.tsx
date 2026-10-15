import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getOrCreateWeekStats } from '../stats';
import type { WeeklyStats } from '../storage';
import { useTheme } from '../theme';

export function StatsCard({ taskCount }: { taskCount: number }) {
  const { c } = useTheme();
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    getOrCreateWeekStats().then(setStats);
  }, [taskCount]);

  if (!stats || hidden || stats.completed === 0) return null;

  const goal = Math.max(stats.completed, stats.created, 10);
  const ratio = Math.min(stats.completed / goal, 1);

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={styles.row}>
        <Text style={[styles.text, { color: c.text }]}>
          🎯 Bu hafta <Text style={{ fontWeight: '700' }}>{stats.completed}</Text> görev tamamladın
        </Text>
        <Pressable onPress={() => setHidden(true)} hitSlop={8} accessibilityLabel="Kapat">
          <Text style={{ color: c.muted, fontSize: 16 }}>✕</Text>
        </Pressable>
      </View>
      <View style={[styles.bar, { backgroundColor: c.surface2 }]}>
        <View style={[styles.fill, { width: `${Math.round(ratio * 100)}%`, backgroundColor: c.success }]} />
      </View>
      <Text style={[styles.sub, { color: c.muted }]}>{stats.completed}/{goal}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12, borderWidth: 1, borderRadius: 14, padding: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  text: { fontSize: 14 },
  bar: { height: 6, borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  sub: { fontSize: 12, marginTop: 4, textAlign: 'right' },
});
