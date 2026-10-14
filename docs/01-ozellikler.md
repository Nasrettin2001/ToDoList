# İş Listesi – Özellik Belgesi

## Amaç
Şirkette çalışırken yapılacak işleri telefondan hızlıca not alabileceğim, sade ve kullanışlı bir **mobil** yapılacaklar uygulaması (Android ve iPhone).
Veriler yalnızca telefonda saklanır; hesap, internet veya sunucu gerekmez.

> Not: Klasörün kökündeki `index.html` ilk hazırlanan masaüstü (tarayıcı) sürümüdür. Mobil uygulama `mobil/` klasöründedir. İkisi veri paylaşmaz.

## Temel Özellikler (istenenler)
| # | Özellik | Açıklama |
|---|---------|----------|
| 1 | Sade arayüz | Tek ana ekran: üstte başlık ve filtreler, ortada liste, altta hızlı ekleme çubuğu. Göreve dokununca detay ekranı açılır |
| 2 | Karanlık / açık mod | Sağ üstteki düğmeyle değişir. Seçim hatırlanır. İlk açılışta telefonun temasına uyar |
| 3 | İleri tarihli hatırlatıcı | Tarih + saat seçilir. **Uygulama kapalıyken bile** telefon bildirimi gelir |
| 4 | Görev içi notlar | Her görevde çok satırlı not alanı |
| 5 | Resim ekleme | Galeriden (çoklu) veya kamerayla çekerek. Küçük resme dokununca tam ekran açılır |

## Ek Özellikler (mevcut)
- **Öncelik:** Düşük / Normal / Yüksek / Acil (renkli şerit).
- **Son tarih:** Hatırlatıcıdan ayrı. Geçmişse kırmızı “Gecikti”.
- **Etiketler:** Örn. `toplantı`, `rapor`. Filtre çubuğunda etikete dokununca filtrelenir.
- **Alt görevler:** Görev içinde kontrol listesi, ilerleme “2/5”.
- **Arama:** Başlık, not, etiket ve alt görevlerde.
- **Akıllı listeler:** Bugün, Yaklaşan (7 gün), Gecikmiş, Tümü, Tamamlanan.
- **Sıralama:** Son tarih / öncelik / eklenme sırası.
- **Tekrarlayan hatırlatıcı:** Yok / Her gün / Hafta içi / Her hafta / Her ay.
- **Bildirimden işlem:** Bildirimdeki “10 dk ertele” ve “Tamamla” düğmeleri. Bildirime dokununca görev açılır.
- **Hızlı hatırlatıcı:** “1 saat sonra”, “Yarın 09:00”, “Pazartesi 09:00”.
- **Silmeyi geri al:** Silinen görev için 5 sn “Geri al”.
- **Tamamlananlar arşivi:** Geri alınabilir.

## Yeni Özellikler (v1.1.0)
- **Görev kopyalama/çoğaltma:** ✅ Detay ekranında “Çoğalt” düğmesi; aynı bilgilerle yeni görev oluşturur (hatırlatıcı hariç).
- **Son tarih + saat:** ✅ `dueDate` alanı sadece tarih değil, isteğe bağlı saat de içerebilir (ör. “20 Eki 14:00”).
- **Görev sayacı/istatistik:** ✅ Ana ekranda “Bu hafta X görev tamamladın” kartı + ilerleme çubuğu.
- **Yedek dosyası alma/verme:** ✅ Tüm veriyi (resimler dahil) tek bir `.json` dosyasına dışa aktar / paylaş / içe aktar.
- **Uygulama rozeti (badge):** ✅ Tamamlanmamış görev sayısı uygulama simgesinde rozet olarak gösterilir.
- **Görev paylaşma:** ✅ Bir görevi metin olarak başka uygulamaya paylaşma (Share Sheet).
- **Animasyonlar:** ✅ LayoutAnimation ile görev ekleme/silme/tamamlama geçişleri.
- **Erişilebilirlik:** ✅ Tüm dokunulabilir öğelerde accessibilityLabel ve accessibilityRole.

- **İlk kullanım rehberi (onboarding):** ✅ İlk açılışta 3 ekranlık tanıtım turu (Görev Ekle, Hatırlatıcı Kur, Tamamla ve Takip Et).

- **Uzun basıp sürükleyerek sıralama:** ✅ Manuel sıralama modunda uzun basıp sürükleyerek görevleri yeniden sırala.
- **Toplu işlem:** ✅ Uzun basınca çoklu seçim modu aktif olur; seçili görevleri topluca tamamla veya sil.

- **Jest birim testleri:** ✅ dates, filters, storage, stats için 28 birim testi (4 test suite).

## Kapsam Dışı (şimdilik)
- Bulut senkronizasyonu, çoklu kullanıcı.
- Uygulama mağazasına yükleme (şimdilik Expo Go ile çalışır; bkz. README).
- PWA desteği (masaüstü sürümü için ileride değerlendirilebilir).
- Widget (ana ekran widget'ı; Expo Go kısıtı — EAS build sonrası değerlendirilebilir).
