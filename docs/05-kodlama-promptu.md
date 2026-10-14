# Kodlama Promptu (Claude Code için)

İlk mobil sürüm bu promptla yazıldı. Yeni özellik eklerken aynı promptu ve docs/ belgelerini referans göster.

---

```
"mobil/" klasöründe "İş Listesi" adlı bir Expo (React Native + TypeScript) yapılacaklar uygulaması geliştiriyoruz.
Önce docs/ klasöründeki belgeleri sırayla oku:
  01-ozellikler.md, 02-veri-modeli.md, 03-teknik.md, 04-arayuz.md
Bu belgeler tek doğruluk kaynağıdır; çelişki görürsen bana sor.

Kurallar:
- Expo SDK sürümünü package.json'dan oku ve o sürümün belgelerine göre yaz
  (Expo her sürümde API değiştiriyor, ezberden yazma). Paket eklerken `npx expo install` kullan.
- Uygulama Expo Go ile çalışabilmeli: yalnızca Expo Go'da bulunan yerel modülleri kullan.
- Veriler AsyncStorage'da, resimler expo-file-system ile uygulama belge klasöründe.
- Hatırlatıcılar expo-notifications ile yerel olarak planlanır (uygulama kapalıyken de çalışmalı),
  tekrar (günlük/hafta içi/haftalık/aylık), erteleme ve bildirim düğmeleri (10 dk ertele, Tamamla) desteklenir.
- Resim: galeriden çoklu seçim ve kamera.
- Karanlık/açık tema; tercih kaydedilir, yoksa telefon teması.
- Tüm arayüz metinleri Türkçe, tarihler tr-TR.
- Dokunma alanları en az 44pt, klavye açılınca hızlı ekleme çubuğu görünür kalmalı.
- Tüm dokunulabilir öğelerde accessibilityLabel ve accessibilityRole tanımla.
- Animasyonlar için LayoutAnimation veya Reanimated kullan; 300 ms'den kısa, doğal hissetmeli.
- Bitirmeden önce `npx tsc --noEmit` çalıştır, hata kalmasın.

Yeni bir özellik eklerken:
1. Önce ilgili docs/ dosyasını güncelle,
2. Sonra kodu yaz,
3. README.md'deki kullanım bölümünü güncelle,
4. Expo Go'da test et (telefon veya emülatörde çalıştırarak doğrula).
```

## Özellik Durumu

| # | Özellik | Durum |
|---|---------|-------|
| 1 | Sade arayüz (ana ekran + detay) | ✅ Yapıldı |
| 2 | Karanlık / açık mod | ✅ Yapıldı |
| 3 | Hatırlatıcılar (tekrar, erteleme, bildirim düğmeleri) | ✅ Yapıldı |
| 4 | Görev içi notlar | ✅ Yapıldı |
| 5 | Resim ekleme (galeri + kamera) | ✅ Yapıldı |
| 6 | Öncelik, son tarih, etiketler, alt görevler | ✅ Yapıldı |
| 7 | Arama, akıllı listeler, sıralama | ✅ Yapıldı |
| 8 | Silmeyi geri al + tamamlananlar arşivi | ✅ Yapıldı |
| 9 | Uzun basıp sürükleyerek sıralama (manuel sıra) | ✅ Yapıldı |
| 10 | Toplu işlem (çoklu seçim) | ✅ Yapıldı |
| 11 | Görev kopyalama/çoğaltma | ✅ Yapıldı |
| 12 | Son tarih + saat | ✅ Yapıldı |
| 13 | Görev sayacı/istatistik | ✅ Yapıldı |
| 14 | Yedek dosyası alma/verme | ✅ Yapıldı |
| 15 | Uygulama rozeti (badge) | ✅ Yapıldı |
| 16 | İlk kullanım rehberi (onboarding) | ✅ Yapıldı |
| 17 | Görev paylaşma | ✅ Yapıldı |
| 18 | Animasyonlar (ekleme/silme/geçiş) | ✅ Yapıldı |
| 19 | Erişilebilirlik iyileştirmeleri | ✅ Yapıldı |
| 20 | Jest birim testleri | ✅ Yapıldı |

## Sürüm ve Değişiklik Günlüğü

| Sürüm | Tarih | Değişiklikler |
|-------|-------|---------------|
| 1.0.0 | 2026-10-12 | İlk sürüm: temel görev yönetimi, hatırlatıcılar, resim, etiket, alt görevler |
| 1.1.0 | 2026-10-13 | Tüm 20 özellik tamamlandı: çoğaltma, son tarih+saat, istatistik, yedekleme, rozet, paylaşma, animasyonlar, a11y, onboarding, sürükle-bırak, toplu işlem, Jest testleri |
