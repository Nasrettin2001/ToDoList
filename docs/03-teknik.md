# Teknik Tasarım (mobil)

## Yığın
- **React Native + Expo (SDK 57) + TypeScript**
- Telefonda **Expo Go** uygulamasıyla çalışır; derleme/Android Studio gerekmez.
- Kullanılan Expo modülleri (hepsi Expo Go içinde hazır):
  | Paket | Ne için |
  |-------|---------|
  | `expo-notifications` | Yerel (lokal) zamanlanmış bildirimler, bildirim düğmeleri |
  | `expo-image-picker` | Galeriden / kameradan resim |
  | `expo-file-system` | Resimleri uygulama klasörüne kopyalama/silme |
  | `@react-native-async-storage/async-storage` | Görevleri saklama |
  | `@react-native-community/datetimepicker` | Tarih ve saat seçici |
  | `react-native-safe-area-context` | Çentik / alt çubuk boşlukları |
  | `@expo/vector-icons` | Simgeler (Ionicons) |

## Dosya yapısı (`mobil/`)
```
App.tsx                     sağlayıcılar + ana ekran
app.json                    Expo ayarları (ad, tema, izin metinleri)
src/types.ts                Task, Reminder… türleri
src/theme.tsx               renkler, tema bağlamı (açık/koyu, kayıtlı)
src/dates.ts                tarih yardımcıları (tr-TR biçim)
src/storage.ts              AsyncStorage okuma/yazma
src/notifications.ts        izin, kanal, planlama, iptal, bildirim düğmeleri
src/images.ts               resim seç/çek, kopyala, sil
src/filters.ts              görünüm filtreleri, arama, sıralama
src/stats.ts                haftalık istatistik (tamamlama/oluşturma sayaçları)
src/backup.ts               yedek dışa/içe aktarma (resimler dahil base64)
src/store.tsx               görev durumu (Context) + tüm eylemler
src/components/*.tsx        TaskRow, FilterBar, TaskDetail, DateTimeField,
                            ImageViewer, Snackbar, QuickAdd, Chip, StatsCard
```

## Hatırlatıcılar
- Uygulama izin ister; Android'de `reminders` adlı yüksek öncelikli kanal açılır.
- Planlama (`notifications.ts → scheduleTask`):
  - Tekrar yok → tek seferlik tarih tetikleyici (zaman geçmişse planlanmaz)
  - Her gün → günlük tetikleyici (saat:dakika)
  - Hafta içi → Pazartesi–Cuma için 5 haftalık tetikleyici
  - Her hafta / Her ay → haftalık / aylık tetikleyici
  - `snoozeAt` varsa ayrıca tek seferlik tetikleyici
- Bildirim kategorisi `reminder`: “10 dk ertele” ve “Tamamla” düğmeleri.
- Bildirime/düğmeye basılınca `store.tsx` yanıtı işler (uygulama kapalıyken açıldıysa da).
- Uygulama açıkken gelen bildirim üstte banner olarak gösterilir.

## Resimler
- Seçilen/çekilen resim `quality: 0.7` ile alınır, `<document>/images/<id>.jpg` olarak kopyalanır.
- Görev silinince (geri alma süresi bitince) dosyalar silinir.

## Tema
- `useColorScheme()` + AsyncStorage'daki tercih. Renkler `theme.tsx` içinde tek yerde.

## Sürükle-bırak (✅ yapıldı)
- `react-native-draggable-flatlist` (veya Reanimated tabanlı çözüm) ile uzun basarak görev sıralama.
- Sıralama modu "Manuel" seçildiğinde aktif olur; `order` alanı güncellenir.
- Sürüklenen satır hafifçe büyür ve gölge alır (görsel ipucu).

## Toplu işlem (✅ yapıldı)
- Ana ekranda uzun basınca çoklu seçim modu aktif olur.
- Seçilen görevlerin üstünde eylem çubuğu: "Tamamla", "Sil", "Etiketle".
- Geri düğmesi veya "İptal" ile seçim modu kapanır.

## Animasyonlar (✅ yapıldı)
- `LayoutAnimation.Presets.easeInEaseOut` ile görev ekleme, silme ve tamamlama geçişleri.
- Android'de `UIManager.setLayoutAnimationEnabledExperimental(true)` ile etkinleştirildi.

## Uygulama rozeti (✅ yapıldı)
- `Notifications.setBadgeCountAsync(pending)` ile tamamlanmamış görev sayısı rozet olarak gösterilir.
- Görev listesi her değiştiğinde otomatik güncellenir.

## Yedekleme (✅ yapıldı)
- Tüm görevler + resimler (base64) tek `.json` dosyasına yazılır.
- Dışa aktarma: `expo-sharing` ile paylaşma ekranı açılır (WhatsApp, e-posta, dosya yöneticisi…).
- İçe aktarma: `expo-document-picker` ile `.json` dosyası seçilir, aynı ID'li görevler üzerine yazılır.

## İlk kullanım rehberi (onboarding) (✅ yapıldı)
- `isListesi.onboarding` anahtarı yoksa veya `"done"` değilse gösterilir.
- 2–3 ekranlık yatay kaydırmalı tanıtım: "Görev ekle", "Hatırlatıcı kur", "Kaydır ve sil".
- Son ekranda isteğe bağlı örnek görevler oluşturma düğmesi.
- "Atla" ile her zaman geçilebilir.

## Görev paylaşma (✅ yapıldı)
- Detay ekranında "Paylaş" düğmesi.
- `expo-sharing` veya `Share` API ile görev başlığı, notlar, alt görevler ve son tarih metin olarak paylaşılır.

## İstatistik (✅ yapıldı)
- Ana ekranın üstünde veya menüde küçük bir özet kartı.
- "Bu hafta X görev tamamladın" + basit ilerleme çubuğu.
- Veriler `isListesi.stats` anahtarında tutulur; her tamamlama ve oluşturmada güncellenir.

## Performans (yeni)
- 500+ görevde FlatList zaten sanal kaydırma kullanır (React Native varsayılan).
- `getItemLayout` sağlanarak sabit satır yüksekliğinde hız artışı.
- Ağır hesaplamalar (filtreleme, sıralama) `useMemo` ile önbelleğe alınır.

## Erişilebilirlik (a11y) (✅ yapıldı)
- Tüm dokunulabilir öğelerde `accessibilityLabel` ve `accessibilityRole`.
- Onay kutuları `accessibilityState={{ checked }}` ile işaretlenir.
- Ekran okuyucu sırası mantıklı olmalı (başlık → meta → eylemler).
- Minimum dokunma alanı 44×44 pt (mevcut).
- Kontrast oranları WCAG AA standardında (en az 4.5:1).

## Test stratejisi (yeni)
- `storage.ts`, `filters.ts`, `dates.ts` ve `notifications.ts` için Jest birim testleri.
- `store.tsx` için entegrasyon testi (mock AsyncStorage ile).
- Bileşen testleri: `@testing-library/react-native` ile `TaskRow`, `QuickAdd`, `FilterBar`.
- Testler `mobil/__tests__/` klasöründe.
