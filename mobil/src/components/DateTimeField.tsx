import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

interface Props {
  mode: 'date' | 'datetime' | 'time';
  value: Date | null;
  label: string; // gösterilecek metin (seçili değer ya da yer tutucu)
  onChange: (d: Date) => void;
}

// Android'de yerel diyaloglar, iOS'ta alttan açılan seçici
export function DateTimeField({ mode, value, label, onChange }: Props) {
  const { c, dark } = useTheme();
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(value ?? defaultDate());

  const pickerMode = mode === 'time' ? 'time' : mode === 'datetime' ? 'date' : 'date';

  const openPicker = () => {
    const start = value ?? defaultDate();
    if (Platform.OS === 'android') {
      if (mode === 'time') {
        DateTimePickerAndroid.open({
          value: start,
          mode: 'time',
          is24Hour: true,
          onChange: (e, time) => {
            if (e.type !== 'set' || !time) return;
            onChange(time);
          },
        });
      } else {
        DateTimePickerAndroid.open({
          value: start,
          mode: 'date',
          onChange: (e, date) => {
            if (e.type !== 'set' || !date) return;
            if (mode === 'date') return onChange(date);
            DateTimePickerAndroid.open({
              value: date,
              mode: 'time',
              is24Hour: true,
              onChange: (e2, time) => {
                if (e2.type !== 'set' || !time) return;
                const d = new Date(date);
                d.setHours(time.getHours(), time.getMinutes(), 0, 0);
                onChange(d);
              },
            });
          },
        });
      }
    } else {
      setDraft(start);
      setIosOpen(true);
    }
  };

  return (
    <>
      <Pressable onPress={openPicker} style={[styles.field, { backgroundColor: c.bg, borderColor: c.border }]}>
        <Text style={{ color: value ? c.text : c.muted, fontSize: 16 }}>{label}</Text>
      </Pressable>
      {Platform.OS === 'ios' && (
        <Modal visible={iosOpen} transparent animationType="slide" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setIosOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: c.surface }]}>
            <View style={styles.sheetHead}>
              <Pressable onPress={() => setIosOpen(false)} hitSlop={10}>
                <Text style={{ color: c.muted, fontSize: 16 }}>İptal</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setIosOpen(false);
                  const d = new Date(draft);
                  if (mode === 'datetime') d.setSeconds(0, 0);
                  onChange(d);
                }}
                hitSlop={10}
              >
                <Text style={{ color: c.accent, fontSize: 16, fontWeight: '700' }}>Tamam</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={draft}
              mode={pickerMode === 'date' && mode === 'datetime' ? 'datetime' : pickerMode}
              display={mode === 'date' ? 'inline' : 'spinner'}
              locale="tr-TR"
              themeVariant={dark ? 'dark' : 'light'}
              onChange={(_, d) => d && setDraft(d)}
            />
          </View>
        </Modal>
      )}
    </>
  );
}

function defaultDate(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}

const styles = StyleSheet.create({
  field: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, minHeight: 44, justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { paddingBottom: 30, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
});
