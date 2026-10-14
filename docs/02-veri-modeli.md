# Veri Modeli (mobil)

Depolama: **AsyncStorage** (telefonun uygulamaya ait alanı). Resimler dosya olarak uygulamanın belge klasöründe (`<document>/images/`) tutulur.

## AsyncStorage anahtarları
| Anahtar | Değer |
|---------|-------|
| `isListesi.tasks` | Görev dizisi (JSON) |
| `isListesi.theme` | `"light"` / `"dark"` (yoksa telefonun teması) |
| `isListesi.sort` | `"due"` / `"priority"` / `"created"` |

## Görev (`Task`)
```ts
{
  id: "t_lx2k9a_4f1",
  title: "Aylık raporu hazırla",
  notes: "Satış rakamlarını ekle…",
  priority: 1,                    // 0 Düşük, 1 Normal, 2 Yüksek, 3 Acil
  tags: ["rapor"],                // küçük harf, tekrarsız
  dueDate: "2026-10-20" | null,   // YYYY-MM-DD
  dueTime: "14:00" | null,        // HH:mm (isteğe bağlı; null ise sadece tarih gösterilir)
  order: 0,                       // manuel sıralama için pozisyon (küçük = üstte)
  reminder: {
    at: 1760954400000,            // seçilen zaman (epoch ms); tekrarlarda saat/gün buradan alınır
    repeat: "none",               // none | daily | weekdays | weekly | monthly
    snoozeAt?: 1760955000000,     // ertelenmiş tek seferlik zaman
    firedAt?: 1760955500000,      // hatırlatıcının en son çaldığı zaman (raporlama/istatistik için)
    notificationIds: ["…"]        // planlanmış telefon bildirimleri (iptal için)
  } | null,
  subtasks: [{ id, text, done }],
  images: [{ id, uri, width, height }], // uri: belge klasöründeki kopya
  completed: false,
  completedAt: null,
  createdAt: 1760900000000,
  updatedAt: 1760900000000
}
```

## Ek AsyncStorage anahtarları (yeni)
| Anahtar | Değer |
|---------|-------|
| `isListesi.stats` | Haftalık istatistik verileri (JSON): `{ weekStart, completed, created }` |
| `isListesi.onboarding` | `"done"` (ilk kullanım rehberi tamamlandı) |

## Kurallar
- Görev tamamlanınca veya silinince bildirimleri iptal edilir; resim dosyaları silme geri alınamaz hale gelince (5 sn) silinir.
- Hatırlatıcı, başlık veya tamamlanma değişince bildirimler yeniden planlanır.
- `order` alanı yalnızca "Manuel" sıralama modunda kullanılır; diğer modlarda yok sayılır.
- Görev çoğaltma: tüm alanlar kopyalanır; `id`, `createdAt`, `updatedAt` yeniden üretilir; `reminder` ve `completed` sıfırlanır.
- Yedek dosyası: `is-listesi-yedek-YYYY-MM-DD.json` — görevler + resimler (base64) tek dosyada.

## Versiyon yükseltme stratejisi
- AsyncStorage şemasız olduğundan, uygulama açılışında `normalizeTask()` ile eski kayıtlara eksik alanlar (`dueTime`, `order`, `firedAt`) eklenir.
- Yedek dosyasında `version: 1` alanı bulunur. İleride format değişirse sürüme göre dönüşüm uygulanır.
