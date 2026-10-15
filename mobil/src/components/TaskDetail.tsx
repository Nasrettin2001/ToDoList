import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dateStr, fmtDateTime, fmtDay, fmtDue, nextOccurrence, parseDay, quickTime } from '../dates';
import { normalizeTag } from '../filters';
import { pickFromLibrary, takePhoto } from '../images';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { DEFAULT_LISTS, PRIORITY_NAMES, REPEAT_NAMES, uid, type Priority, type Repeat, type Task } from '../types';
import { Chip } from './Chip';
import { DateTimeField } from './DateTimeField';
import { ImageViewer } from './ImageViewer';

const REPEATS: Repeat[] = ['none', 'daily', 'weekdays', 'weekly', 'monthly'];

export function TaskDetail() {
  const { tasks, selectedId, open } = useStore();
  const task = tasks.find((t) => t.id === selectedId) ?? null;
  return (
    <Modal
      visible={!!task}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={() => open(null)}
    >
      {task && <DetailBody key={task.id} task={task} />}
    </Modal>
  );
}

function DetailBody({ task: t }: { task: Task }) {
  const { c, prioColor } = useTheme();
  const insets = useSafeAreaInsets();
  const store = useStore();
  const [tagText, setTagText] = useState('');
  const [subText, setSubText] = useState('');
  const [viewer, setViewer] = useState<string | null>(null);
  const [titleDirty, setTitleDirty] = useState(false);

  const set = (fn: (t: Task) => Partial<Task>, reschedule = false) => store.update(t.id, fn, reschedule);
  const close = () => {
    if (!t.title.trim()) set(() => ({ title: 'Adsız görev' }));
    store.open(null);
  };

  const addTag = () => {
    const v = normalizeTag(tagText);
    setTagText('');
    if (v && !t.tags.includes(v)) set((cur) => ({ tags: [...cur.tags, v] }));
  };
  const addSub = () => {
    const v = subText.trim();
    setSubText('');
    if (v) set((cur) => ({ subtasks: [...cur.subtasks, { id: uid('s'), text: v, done: false }] }));
  };
  const confirmDelete = () =>
    Alert.alert('Görev silinsin mi?', t.title, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => store.remove(t.id) },
    ]);

  const shareTask = () => {
    const lines = [t.title];
    if (t.dueDate) lines.push('📅 Son tarih: ' + fmtDue(t.dueDate, t.dueTime).text);
    if (t.subtasks.length) {
      lines.push('Alt görevler:');
      t.subtasks.forEach((s) => lines.push(`  ${s.done ? '✅' : '⬜'} ${s.text}`));
    }
    if (t.notes.trim()) lines.push('\n' + t.notes.trim());
    Share.share({ message: lines.join('\n') });
  };

  const r = t.reminder;
  const nextAt = r ? nextOccurrence(r.at, r.repeat) : null;
  const iosTop = Platform.OS === 'ios' ? 0 : insets.top;

  return (
    <View style={[styles.flex, { backgroundColor: c.bg }]}>
      <View style={[styles.head, { paddingTop: iosTop + 8, backgroundColor: c.surface, borderBottomColor: c.border }]}>
        <IconBtn name="close" color={c.text} onPress={close} label="Kapat" />
        <Text style={[styles.headTitle, { color: c.text }]} numberOfLines={1}>
          Görev
        </Text>
        <IconBtn name="share-outline" color={c.text} onPress={shareTask} label="Paylaş" />
        <Pressable
          onPress={() => store.toggleComplete(t.id)}
          style={[styles.doneBtn, { backgroundColor: t.completed ? c.accent : c.surface2 }]}
        >
          <Ionicons name="checkmark" size={18} color={t.completed ? c.onAccent : c.text} />
          <Text style={{ color: t.completed ? c.onAccent : c.text, fontWeight: '600' }}>{t.completed ? 'Tamamlandı' : 'Tamamla'}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
          <TextInput
            defaultValue={t.title}
            onChangeText={(v) => {
              setTitleDirty(true);
              set(() => ({ title: v }));
            }}
            onBlur={() => titleDirty && t.reminder && store.update(t.id, () => ({}), true)}
            placeholder="Görev başlığı"
            placeholderTextColor={c.muted}
            multiline
            maxLength={300}
            style={[styles.title, { color: c.text }]}
          />

          <Section title="Öncelik">
            <View style={styles.wrapRow}>
              {([0, 1, 2, 3] as Priority[]).map((p) => (
                <Chip key={p} label={PRIORITY_NAMES[p]} active={t.priority === p} color={prioColor(p)} onPress={() => set(() => ({ priority: p }))} />
              ))}
            </View>
          </Section>

          <Section title="📁 Liste">
            <View style={styles.wrapRow}>
              {DEFAULT_LISTS.map((l) => (
                <Chip key={l.id} label={l.name} active={t.listId === l.id} color={l.color} onPress={() => set(() => ({ listId: l.id }))} />
              ))}
            </View>
          </Section>

          <Section title="📅 Son tarih">
            <View style={styles.row}>
              <DateTimeField
                mode="date"
                value={t.dueDate ? parseDay(t.dueDate) : null}
                label={t.dueDate ? fmtDay(t.dueDate) : 'Tarih seç'}
                onChange={(d) => set(() => ({ dueDate: dateStr(d) }))}
              />
              {t.dueDate && (
                <DateTimeField
                  mode="time"
                  value={t.dueTime ? (() => { const [h, m] = t.dueTime.split(':').map(Number); const d = new Date(); d.setHours(h, m, 0, 0); return d; })() : null}
                  label={t.dueTime ?? 'Saat'}
                  onChange={(d) => {
                    const hh = String(d.getHours()).padStart(2, '0');
                    const mm = String(d.getMinutes()).padStart(2, '0');
                    set(() => ({ dueTime: `${hh}:${mm}` }));
                  }}
                />
              )}
              {t.dueDate && <IconBtn name="close-circle" color={c.muted} onPress={() => set(() => ({ dueDate: null, dueTime: null }))} label="Tarihi kaldır" />}
            </View>
            {t.dueDate && t.dueTime && (
              <Pressable onPress={() => set(() => ({ dueTime: null }))} hitSlop={8}>
                <Text style={[styles.hint, { color: c.accent }]}>Saati kaldır</Text>
              </Pressable>
            )}
          </Section>

          <Section title="🔔 Hatırlatıcı">
            <View style={styles.row}>
              <DateTimeField
                mode="datetime"
                value={r ? new Date(r.at) : null}
                label={r ? fmtDateTime(r.at) : 'Tarih ve saat seç'}
                onChange={(d) => store.setReminder(t.id, d.getTime())}
              />
              {r && <IconBtn name="close-circle" color={c.muted} onPress={() => store.setReminder(t.id, null)} label="Hatırlatıcıyı kaldır" />}
            </View>
            <View style={styles.wrapRow}>
              <Chip label="1 saat sonra" onPress={() => store.setReminder(t.id, quickTime('1h'))} />
              <Chip label="Yarın 09:00" onPress={() => store.setReminder(t.id, quickTime('tomorrow'))} />
              <Chip label="Pazartesi 09:00" onPress={() => store.setReminder(t.id, quickTime('monday'))} />
            </View>
            {r && (
              <>
                <View style={styles.wrapRow}>
                  {REPEATS.map((rep) => (
                    <Chip key={rep} label={REPEAT_NAMES[rep]} active={r.repeat === rep} onPress={() => store.setReminder(t.id, r.at, rep)} />
                  ))}
                </View>
                <Text style={[styles.hint, { color: c.muted }]}>
                  {t.completed
                    ? 'Görev tamamlandığı için bildirim gönderilmeyecek.'
                    : nextAt
                      ? 'Sonraki bildirim: ' + fmtDateTime(nextAt)
                      : 'Bu zaman geçti.'}
                  {r.snoozeAt && r.snoozeAt > Date.now() ? '  ·  Ertelendi: ' + fmtDateTime(r.snoozeAt) : ''}
                </Text>
              </>
            )}
          </Section>

          <Section title="Etiketler">
            <View style={styles.wrapRow}>
              {t.tags.map((g) => (
                <Chip key={g} label={'#' + g + '  ✕'} onPress={() => set((cur) => ({ tags: cur.tags.filter((x) => x !== g) }))} />
              ))}
            </View>
            <TextInput
              value={tagText}
              onChangeText={setTagText}
              onSubmitEditing={addTag}
              submitBehavior="submit"
              returnKeyType="done"
              placeholder="Etiket yaz, Enter… (örn. toplantı)"
              placeholderTextColor={c.muted}
              autoCapitalize="none"
              maxLength={40}
              style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
            />
          </Section>

          <Section title={'Alt görevler' + (t.subtasks.length ? ` (${t.subtasks.filter((s) => s.done).length}/${t.subtasks.length})` : '')}>
            {t.subtasks.map((s) => (
              <View key={s.id} style={styles.subRow}>
                <Pressable
                  hitSlop={8}
                  onPress={() => set((cur) => ({ subtasks: cur.subtasks.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)) }))}
                >
                  <Ionicons name={s.done ? 'checkbox' : 'square-outline'} size={24} color={s.done ? c.accent : c.muted} />
                </Pressable>
                <TextInput
                  defaultValue={s.text}
                  onEndEditing={(e) => {
                    const v = e.nativeEvent.text.trim();
                    if (v && v !== s.text) set((cur) => ({ subtasks: cur.subtasks.map((x) => (x.id === s.id ? { ...x, text: v } : x)) }));
                  }}
                  style={[styles.subText, { color: s.done ? c.muted : c.text }, s.done && styles.strike]}
                />
                <IconBtn name="trash-outline" color={c.muted} size={20} label="Alt görevi sil" onPress={() => set((cur) => ({ subtasks: cur.subtasks.filter((x) => x.id !== s.id) }))} />
              </View>
            ))}
            <TextInput
              value={subText}
              onChangeText={setSubText}
              onSubmitEditing={addSub}
              submitBehavior="submit"
              returnKeyType="done"
              placeholder="+ Alt görev ekle"
              placeholderTextColor={c.muted}
              maxLength={200}
              style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
            />
          </Section>

          <Section title="📝 Notlar">
            <TextInput
              defaultValue={t.notes}
              onChangeText={(v) => set(() => ({ notes: v }))}
              placeholder="Bu görevle ilgili notlar…"
              placeholderTextColor={c.muted}
              multiline
              textAlignVertical="top"
              style={[styles.input, styles.notes, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
            />
          </Section>

          <Section title="🖼 Resimler">
            {t.images.length > 0 && (
              <View style={styles.grid}>
                {t.images.map((img) => (
                  <Pressable
                    key={img.id}
                    onPress={() => setViewer(img.uri)}
                    onLongPress={() =>
                      Alert.alert('Resim silinsin mi?', undefined, [
                        { text: 'Vazgeç', style: 'cancel' },
                        { text: 'Sil', style: 'destructive', onPress: () => store.removeImage(t.id, img.id) },
                      ])
                    }
                    style={[styles.thumb, { borderColor: c.border, backgroundColor: c.surface2 }]}
                  >
                    <Image source={{ uri: img.uri }} style={styles.thumbImg} />
                  </Pressable>
                ))}
              </View>
            )}
            <View style={styles.row}>
              <ActionBtn icon="images-outline" label="Galeriden" onPress={async () => store.addImages(t.id, await pickFromLibrary())} />
              <ActionBtn icon="camera-outline" label="Fotoğraf çek" onPress={async () => store.addImages(t.id, await takePhoto())} />
            </View>
            {t.images.length > 0 && <Text style={[styles.hint, { color: c.muted }]}>Silmek için resme uzun bas.</Text>}
          </Section>

          <Text style={[styles.hint, { color: c.muted, marginTop: 8 }]}>
            Oluşturuldu: {new Date(t.createdAt).toLocaleString('tr-TR')}
            {t.completedAt ? '\nTamamlandı: ' + new Date(t.completedAt).toLocaleString('tr-TR') : ''}
          </Text>

          <View style={styles.bottomActions}>
            <Pressable onPress={() => store.duplicateTask(t.id)} style={[styles.bottomBtn, { borderColor: c.border }]}>
              <Ionicons name="copy-outline" size={18} color={c.accent} />
              <Text style={{ color: c.accent, fontWeight: '600', fontSize: 16 }}>Çoğalt</Text>
            </Pressable>
            <Pressable onPress={confirmDelete} style={[styles.bottomBtn, { borderColor: c.danger }]}>
              <Ionicons name="trash-outline" size={18} color={c.danger} />
              <Text style={{ color: c.danger, fontWeight: '600', fontSize: 16 }}>Sil</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <ImageViewer uri={viewer} onClose={() => setViewer(null)} />
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: c.muted }]}>{title}</Text>
      {children}
    </View>
  );
}

function IconBtn(props: { name: keyof typeof Ionicons.glyphMap; color: string; onPress: () => void; label: string; size?: number }) {
  return (
    <Pressable onPress={props.onPress} hitSlop={8} accessibilityLabel={props.label} style={styles.iconBtn}>
      <Ionicons name={props.name} size={props.size ?? 24} color={props.color} />
    </Pressable>
  );
}

function ActionBtn({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionBtn, { borderColor: c.border, backgroundColor: c.surface, opacity: pressed ? 0.7 : 1 }]}>
      <Ionicons name={icon} size={20} color={c.accent} />
      <Text style={{ color: c.text, fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  headTitle: { flex: 1, fontSize: 17, fontWeight: '600' },
  doneBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 99, paddingHorizontal: 14, minHeight: 38 },
  body: { padding: 16, gap: 20 },
  title: { fontSize: 22, fontWeight: '600', paddingVertical: 4 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hint: { fontSize: 13 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, minHeight: 44, fontSize: 16 },
  notes: { minHeight: 130, paddingTop: 12, paddingBottom: 12 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  subText: { flex: 1, fontSize: 16, paddingVertical: 6 },
  strike: { textDecorationLine: 'line-through' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumb: { width: 96, height: 96, borderRadius: 10, overflow: 'hidden', borderWidth: 1 },
  thumbImg: { width: '100%', height: '100%' },
  iconBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 10, minHeight: 48 },
  bottomActions: { flexDirection: 'row', gap: 10 },
  bottomBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 10, minHeight: 48 },
});
