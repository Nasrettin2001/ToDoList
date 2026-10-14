# Arayüz Planı (mobil)

## Ana ekran
```
┌───────────────────────────────┐
│ İş Listesi        🔍  ⇅  ☾    │  başlık, ara, sırala, tema
│ [Ara…                       ] │  (🔍 ile açılır)
│ (Bugün 3)(Yaklaşan)(Gecikmiş 1)(Tümü)(Tamamlanan) #rapor #toplantı → │
│───────────────────────────────│
│▌○ Aylık raporu hazırla        │  sol şerit = öncelik rengi
│▌  📅 Gecikti·12 Eki 🔔 Yarın 09:00 ☑ 1/3 📎2 #rapor │
│▌○ Müşteri araması             │
│                               │
│───────────────────────────────│
│ [ + Yeni görev…          ] (➤)│  hızlı ekleme (klavyeyle yukarı kayar)
└───────────────────────────────┘
```
- Yuvarlağa dokun → tamamla (5 sn “Geri al”).
- Satıra dokun → detay ekranı. Uzun bas → silme onayı.

## Detay ekranı (tam ekran sayfa)
Üst: ✕ kapat · başlık · ✓ tamamla.
Sırasıyla: Başlık alanı → Öncelik (4 çip) → Son tarih (seç / kaldır) → Hatırlatıcı (tarih-saat, tekrar çipleri, hızlı çipler) → Etiketler → Alt görevler → Notlar → Resimler (Galeri / Kamera düğmeleri, küçük resim ızgarası) → Sil.
Tüm değişiklikler anında kaydedilir.

## Renkler
| Öğe | Açık | Koyu |
|-----|------|------|
| Arka plan | #f6f7f9 | #0f1115 |
| Yüzey | #ffffff | #181b21 |
| Metin | #1d2330 | #e6e8ec |
| Vurgu | #3b6cf6 | #6b93ff |
| Başarı (success) | #30a46c | #3dd68c |
| Acil / Yüksek / Normal / Düşük | #e5484d / #f08c00 / #3b6cf6 / #8b93a1 | #ff6b6f / #ffa94d / #6b93ff / #8b93a1 |

## Dokunma alanları
En az 44×44 pt. Yazı boyutu 15–16.

## Animasyonlar (yeni)
- **Görev ekleme:** Yeni görev aşağıdan kayarak (slide-up) ve soluklaşarak (fade-in) listeye girer.
- **Görev tamamlama:** Başlık üstü çizili olur → satır soluklaşarak kaybolur (300 ms gecikme ile listeden çıkar).
- **Görev silme:** Sola kaydırma (swipe) ile kırmızı "Sil" alanı görünür; bırakınca silinir + "Geri al" toast.
- **Detay ekranı geçişi:** Aşağıdan yukarıya kayma (slide-up modal tarzı).
- **Sürükle-bırak:** Sürüklenen satır %105 büyür, gölge alır ve hafif döner.

## Toplu seçim modu (yeni)
```
┌───────────────────────────────┐
│ 3 görev seçili    [İptal]     │  üst eylem çubuğu
│ [✓ Tamamla] [🏷 Etiketle] [🗑 Sil] │
│───────────────────────────────│
│ ☑ Aylık raporu hazırla        │  seçili (vurgulanmış)
│ ☐ Müşteri araması             │  seçilmemiş
│ ☑ Toplantı notları            │  seçili
└───────────────────────────────┘
```
- Bir göreve uzun basınca çoklu seçim modu açılır.
- Dokunarak diğer görevler seçilir/seçimi kaldırılır.
- Üstteki eylem çubuğundan toplu işlem yapılır.

## Görev detay ekranı (güncelleme)
Mevcut düzene eklenenler:
- **Çoğalt düğmesi:** "Sil" düğmesinin yanında "Çoğalt" düğmesi; tıklayınca aynı bilgilerle yeni görev oluşturur.
- **Paylaş düğmesi:** Üst çubukta paylaşma simgesi; görev bilgilerini metin olarak paylaşır.
- **Son tarih + saat:** Son tarih alanının yanında isteğe bağlı saat seçici.

## İstatistik kartı (yeni)
```
┌───────────────────────────────┐
│ 🎯 Bu hafta 8 görev tamamladın │
│ ████████░░  8/10               │  ilerleme çubuğu
└───────────────────────────────┘
```
- Ana ekranın üstünde (filtre çubuğunun altında) küçük bir motivasyon kartı.
- Haftalık tamamlama sayısı ve basit ilerleme göstergesi.
- Kapatılabilir (o hafta için gizlenir).

## İlk kullanım rehberi (onboarding) (yeni)
- 3 ekranlık yatay kaydırmalı tanıtım:
  1. "Görev ekle" — Alttaki kutuyu vurgular
  2. "Hatırlatıcı kur" — Tarih-saat seçiciyi gösterir
  3. "Kaydır ve düzenle" — Sola kaydırma hareketini animasyonla gösterir
- Alt nokta göstergesi (pagination dots) + "Atla" ve "Başla" düğmeleri.
- Son ekranda: "Örnek görevler eklensin mi?" seçeneği.

## Boş durumlar (güncelleme)
Mevcut metinlere ek:
- İlk açılış (görev yok): "İlk görevini eklemek için alttaki kutuyu kullan 👇"
- Tüm görevler tamamlandı: "Harika, her şey tamam! 🎉"
