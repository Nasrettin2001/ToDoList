import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';

interface Props {
  label: string;
  active?: boolean;
  color?: string; // aktifken kullanılacak renk
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, active, color, onPress, onLongPress, style }: Props) {
  const { c } = useTheme();
  const tint = color ?? c.accent;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [
        styles.chip,
        { borderColor: active ? tint : c.border, backgroundColor: active ? tint : c.surface2, opacity: pressed ? 0.7 : 1 },
        style,
      ]}
    >
      <Text style={[styles.text, { color: active ? c.onAccent : c.text }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, minHeight: 34, justifyContent: 'center' },
  text: { fontSize: 14 },
});
