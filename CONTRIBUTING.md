# Katkı rehberi

Katkılar memnuniyetle karşılanır. Küçük bir proje, süreci de kısa tutuyoruz.

## Geliştirme ortamı

```bash
npm install
```

Ardından `.env.example` dosyasını `.env.local` olarak kopyalayıp doldurun ve
README'deki **Lokal geliştirme** bölümündeki iki docker konteynerini çalıştırın
(Neon'un HTTP sürücüsü düz Postgres'e bağlanamaz, proxy şart). Sonra:

```bash
npm run dev
curl -X POST http://localhost:3000/api/seed -H "x-seed-token: $SEED_TOKEN"
```

## Göndermeden önce

İki komut da hatasız geçmeli:

```bash
npm run lint
npm run build
```

`build` aynı zamanda tip kontrolü yapar. `sprint.config.ts` doğrulaması modül
yüklenirken çalıştığı için bozuk bir yapılandırma derlemeyi de düşürebilir.

## Kod hakkında birkaç not

- Arayüz metinleri, yorumlar ve hata mesajları **Türkçe**. Kod tanımlayıcıları
  İngilizce.
- Yeni bir mutasyon eklerken `lib/audit.ts`'teki `logActivity`'yi çağırın —
  log'lanmayan aksiyon kalmamalı.
- Yeni bir track rengi gerekiyorsa `lib/config-types.ts`'teki `TrackColor` ile
  `lib/config.ts`'teki `PALETTE` sabitini birlikte güncelleyin; Tailwind
  sınıfları statik yazılmak zorunda.
- Şema değişikliği yapıyorsanız tek kaynak `lib/schema.ts` içindeki
  `SCHEMA_SQL`'dir ve tüm ifadeler `IF NOT EXISTS` kalmalı.
- `mcp/` kendi `package.json`'ı olan ayrı bir pakettir ve düz JavaScript'tir;
  web tarafındaki TypeScript modüllerini import edemez. Etiket normalizasyonu
  ile mention çözümlemesi bu yüzden iki yerde duruyor — birini değiştirirken
  diğerini de güncelleyin.

## Commit mesajları

Tek satır, emir kipi, 72 karakteri geçmeyen bir özet. Neyin değiştiğini
söyleyin; gerekiyorsa boş bir satırdan sonra nedenini açıklayın.

```
Görev kartına etiket sayacı ekle
Seed uç noktasında boş token durumunu 403'e çevir
```

Bir commit bir iş yapsın. Biçim düzeltmesiyle davranış değişikliğini aynı
commit'e koymayın.

## Pull request akışı

1. `main` üzerinden bir dal açın (`feature/...`, `fix/...`).
2. Değişikliği yapın, `npm run lint` ve `npm run build` çalıştırın.
3. PR açıklamasında **ne** değiştiğini ve **neden** gerektiğini yazın; arayüz
   değişiklikleri için ekran görüntüsü ekleyin.
4. Şema ya da ortam değişkeni etkileyen değişikliklerde README'yi de güncelleyin.
5. Büyük bir değişikliğe başlamadan önce bir issue açıp konuşmak, boşa emek
   harcamamak için iyi bir fikir.
