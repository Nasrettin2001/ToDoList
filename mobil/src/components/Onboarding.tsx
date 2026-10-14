import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View, type ViewToken } from 'react-native';
import { useTheme } from '../theme';

const { width } = Dimensions.get('window');

interface Slide {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  { icon: 'add-circle-outline', title: 'Görev Ekle', body: 'Alt çubuğa yaz ve gönder.\nÖncelik, etiket ve son tarih ekle.' },
  { icon: 'notifications-outline', title: 'Hatırlatıcı Kur', body: 'Göreve dokun, tarih+saat seç.\nUygulama kapalıyken bile bildirim alırsın.' },
  { icon: 'checkmark-done-outline', title: 'Tamamla ve Takip Et', body: 'Daireye dokun → tamamla.\nHaftalık istatistiklerini takip et.' },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const { c } = useTheme();
  const [index, setIndex] = useState(0);
  const ref = useRef<FlatList>(null);

  const onChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index);
  }).current;

  const next = () => {
    if (index < SLIDES.length - 1) ref.current?.scrollToIndex({ index: index + 1 });
    else onDone();
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <Pressable onPress={onDone} style={styles.skip} accessibilityLabel="Atla">
        <Text style={{ color: c.muted, fontSize: 15 }}>Atla</Text>
      </Pressable>
      <FlatList
        ref={ref}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.iconWrap, { backgroundColor: c.accent + '22' }]}>
              <Ionicons name={item.icon} size={64} color={c.accent} />
            </View>
            <Text style={[styles.title, { color: c.text }]}>{item.title}</Text>
            <Text style={[styles.body, { color: c.muted }]}>{item.body}</Text>
          </View>
        )}
      />
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i === index ? c.accent : c.border }]} />
          ))}
        </View>
        <Pressable onPress={next} style={[styles.btn, { backgroundColor: c.accent }]} accessibilityRole="button" accessibilityLabel={index === SLIDES.length - 1 ? 'Başla' : 'İleri'}>
          <Text style={[styles.btnText, { color: c.onAccent }]}>{index === SLIDES.length - 1 ? 'Başla' : 'İleri'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  skip: { position: 'absolute', top: 56, right: 20, zIndex: 10 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconWrap: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  body: { fontSize: 16, lineHeight: 24, textAlign: 'center' },
  footer: { paddingHorizontal: 32, paddingBottom: 48, gap: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText: { fontSize: 17, fontWeight: '600' },
});
