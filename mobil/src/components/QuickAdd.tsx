import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useStore } from '../store';
import { useTheme } from '../theme';

export function QuickAdd({ bottomInset }: { bottomInset: number }) {
  const { c } = useTheme();
  const { addTask } = useStore();
  const [text, setText] = useState('');

  const submit = () => {
    const v = text.trim();
    if (!v) return;
    addTask(v);
    setText('');
  };

  return (
    <View style={[styles.wrap, { backgroundColor: c.surface, borderTopColor: c.border, paddingBottom: 10 + bottomInset }]}>
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={submit}
        submitBehavior="submit"
        returnKeyType="done"
        placeholder="+ Yeni görev yaz…"
        placeholderTextColor={c.muted}
        maxLength={300}
        style={[styles.input, { backgroundColor: c.bg, borderColor: c.border, color: c.text }]}
      />
      <Pressable
        onPress={submit}
        accessibilityRole="button"
        accessibilityLabel="Ekle"
        style={({ pressed }) => [styles.btn, { backgroundColor: c.accent, opacity: text.trim() ? (pressed ? 0.8 : 1) : 0.5 }]}
      >
        <Ionicons name="arrow-up" size={22} color={c.onAccent} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, borderWidth: 1, borderRadius: 22, paddingHorizontal: 16, minHeight: 44, fontSize: 16 },
  btn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
