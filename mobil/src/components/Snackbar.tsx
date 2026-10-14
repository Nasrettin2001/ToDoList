import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useStore } from '../store';
import { useTheme } from '../theme';

export function Snackbar({ bottom }: { bottom: number }) {
  const { c, dark } = useTheme();
  const { snack, hideSnack } = useStore();

  useEffect(() => {
    if (!snack) return;
    const t = setTimeout(hideSnack, snack.actionText ? 5000 : 2500);
    return () => clearTimeout(t);
  }, [snack, hideSnack]);

  if (!snack) return null;
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
      <View style={[styles.box, { backgroundColor: c.text }]}>
        <Text style={[styles.text, { color: c.bg }]}>{snack.text}</Text>
        {snack.actionText && (
          <Pressable
            hitSlop={10}
            onPress={() => {
              hideSnack();
              snack.onAction?.();
            }}
          >
            <Text style={[styles.action, { color: dark ? '#3b6cf6' : '#9db6ff' }]}>{snack.actionText}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  box: { flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, maxWidth: 480, elevation: 6 },
  text: { fontSize: 15, flexShrink: 1 },
  action: { fontSize: 15, fontWeight: '700' },
});
