<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Bu depoda çalışırken

Dil: arayüz metinleri, kod yorumları ve hata mesajları **Türkçe**; kod
tanımlayıcıları İngilizce. Türkçe yazarken ş, ç, ğ, ı, İ, ö, ü karakterlerini
ASCII karşılıklarıyla değiştirme.

Bilmen gereken beş kural:

1. **`sprint.config.ts` kullanıcının dosyası.** Ekip, gün ve görev verisi
   yalnızca orada durur. Kod içine e-posta, isim veya track anahtarı gömme —
   hepsi `lib/config.ts` üzerinden gelir.

2. **Şemanın tek kaynağı `lib/schema.ts`.** `.sql` dosyası yok, ikinci kopya
   yok. Tüm ifadeler `IF NOT EXISTS` kalmalı; tohumlama tekrar çağrılabilir
   olmak zorunda.

3. **Her mutasyon `logActivity` çağırır** (`lib/audit.ts`). Panonun ayırt edici
   işi denetim izi tutmak; log'lanmayan bir aksiyon eklemek bunu bozar. MCP
   tarafında karşılığı `mcp/server.js` içindeki aynı adlı fonksiyon.

4. **Tailwind sınıfları statik yazılır.** `bg-${renk}-100` gibi çalışma
   zamanında kurulan diziler boş stil üretir. Yeni renk gerekiyorsa
   `lib/config.ts`'teki `PALETTE` ile `lib/config-types.ts`'teki `TrackColor`
   birlikte güncellenir.

5. **`proxy.ts`, `middleware.ts` değil.** Next.js 16'da dosya adı `proxy.ts`,
   dışa açılan fonksiyon adı `proxy`. Yalnızca JWT doğrular, veritabanına
   dokunmaz; asıl yetki kontrolü route handler'larda tekrarlanır.

Doğrulama: `npm run lint` ve `npm run build` ikisi de hatasız geçmeli.
`build` tip kontrolünü de yapar.

`mcp/` ayrı bir npm paketidir (kendi `package.json`'ı var, düz JavaScript).
Web tarafındaki TypeScript modüllerini import edemez; bu yüzden etiket
normalizasyonu ve mention çözümlemesi orada bilinçli olarak ikinci kez yazılı.
Birini değiştirirsen diğerini de değiştir.
