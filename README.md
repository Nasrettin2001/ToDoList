# İş Listesi ✓ (mobil)

Şirkette yapılacak işleri telefondan takip etmek için sade bir yapılacaklar uygulaması.
Android ve iPhone'da çalışır. Veriler yalnızca telefonda kalır.

> **Sürüm:** 1.0.0 · Değişiklik günlüğü için bkz. `docs/05-kodlama-promptu.md`

<!-- TODO: Ekran görüntüsü eklenecek -->
<!-- ![Ana ekran](docs/screenshots/ana-ekran.png) -->

## Klasörde neler var?
```
mobil/        ← mobil uygulama (Expo / React Native)
docs/         ← planlama belgeleri ve Claude Code promptu
index.html, css/, js/  ← ilk hazırlanan masaüstü (tarayıcı) sürümü, istersen bilgisayarda kullanabilirsin
```

## Telefonda çalıştırma (ilk kez)
1. Bilgisayara **Node.js** kur: https://nodejs.org → “LTS” sürümünü indir, kur.
2. Telefona **Expo Go** uygulamasını kur (Play Store / App Store).
3. `mobil` klasörünü aç, adres çubuğuna `cmd` yazıp Enter'a bas. Açılan pencerede sırayla:
   ```
   npm install
   npx expo start
   ```
4. Ekranda bir **QR kod** çıkar.
   - Android: Expo Go'yu aç → “Scan QR code” ile tara.
   - iPhone: Kamera uygulamasıyla QR'ı tara, çıkan bağlantıya dokun.
5. Uygulama telefonda açılır. İlk hatırlatıcıda bildirim izni sorulur, **İzin ver** de.

> Telefon ve bilgisayar **aynı Wi-Fi**'da olmalı. Şirket ağı engellerse `npx expo start --tunnel` dene.
> Sonraki seferlerde sadece `npx expo start` yeterli.

## Kullanım
| Ne yapmak istiyorum? | Nasıl? |
|---|---|
| Görev eklemek | Alttaki kutuya yaz, ↑ düğmesine bas |
| Ayrıntıları düzenlemek | Göreve dokun. Her şey otomatik kaydedilir |
| Tamamlamak | Soldaki yuvarlağa dokun (5 sn içinde “Geri al”) |
| Silmek | Göreve uzun bas ya da detayda “Görevi sil” |
| Hatırlatıcı | Detayda tarih-saat seç veya “1 saat sonra / Yarın 09:00 / Pazartesi 09:00”. İstersen tekrar seç (her gün, hafta içi…) |
| Bildirim gelince | “10 dk ertele” veya “Tamamla” düğmeleri; bildirime dokununca görev açılır |
| Not almak | Detaydaki *Notlar* alanı |
| Resim eklemek | Detayda *Galeriden* veya *Fotoğraf çek*. Resme dokun: büyür. Uzun bas: sil |
| Etiket / alt görev | Detayda yaz, Enter |
| Filtrelemek | Üstteki Bugün / Yaklaşan / Gecikmiş / Tümü / Tamamlanan ve #etiket düğmeleri |
| Aramak / sıralamak | Üstteki 🔍 ve ⇅ simgeleri |
| Karanlık / açık mod | Üstteki ☾ / ☀ simgesi |

## Bilmen gerekenler
- Hatırlatıcılar telefonun kendi bildirim sistemiyle planlanır; **uygulama kapalıyken de** gelir.
- Expo Go geliştirme amaçlıdır. Uygulamayı Expo Go olmadan, telefona kalıcı olarak kurmak istersen (Android için .apk) bir sonraki adımda bunu birlikte yapabiliriz.
- Uygulamayı silersen veriler de silinir.

## Bilinen sorunlar
- Expo Go'da yerel bildirim kanalları bazen gecikebilir; uygulama ön plandayken banner gösterilir.
- Çok büyük resimler (10 MB+) eklenirken kısa bir donma olabilir.
- Şirket Wi-Fi'ları Expo Go bağlantısını engelleyebilir; `npx expo start --tunnel` kullanılabilir.

## Yeni özellik eklemek
`docs/05-kodlama-promptu.md` içindeki promptu Claude Code'a ver; önce `docs/` belgelerini güncelleyip sonra kodu yazacak.
