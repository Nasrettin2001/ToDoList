import { useRef, useEffect } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

interface Segment {
  key: string;
  label: string;
  count?: number;
  color?: string;
}

interface Props {
  segments: Segment[];
  activeKey: string;
  onSelect: (key: string) => void;
}

export function SegmentBar({ segments, activeKey, onSelect }: Props) {
  const { c } = useTheme();

  return (
    <View style={[styles.container, { borderBottomColor: c.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {segments.map((seg) => {
          const active = seg.key === activeKey;
          const tint = seg.color ?? c.accent;
          return (
            <Pressable
              key={seg.key}
              onPress={() => onSelect(seg.key)}
              style={[styles.item, active && { backgroundColor: tint + '18' }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              {seg.color && (
                <View style={[styles.dot, { backgroundColor: active ? tint : c.muted }]} />
              )}
              <Text
                style={[
                  styles.label,
                  { color: active ? tint : c.muted },
                  active && styles.labelActive,
                ]}
                numberOfLines={1}
              >
                {seg.label}
              </Text>
              {seg.count != null && seg.count > 0 && (
                <View style={[styles.badge, { backgroundColor: active ? tint : c.surface2 }]}>
                  <Text style={[styles.badgeText, { color: active ? '#fff' : c.muted }]}>
                    {seg.count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scroll: {
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 4,
    paddingTop: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 15,
  },
  labelActive: {
    fontWeight: '700',
  },
  badge: {
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
