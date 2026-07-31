# Sprint Panosu

[![CI](https://github.com/mehmetefeaytas/sprint-board/actions/workflows/ci.yml/badge.svg)](https://github.com/mehmetefeaytas/sprint-board/actions/workflows/ci.yml)
[![Lisans: MIT](https://img.shields.io/badge/lisans-MIT-blue.svg)](LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![Neon Postgres](https://img.shields.io/badge/Neon-Postgres-00e599.svg)](https://neon.tech)
[![MCP](https://img.shields.io/badge/MCP-sunucusu%20dahil-6f42c1.svg)](mcp/README.md)

[English](README.md) · **Türkçe**

Küçük ekipler için hafif bir sprint takip panosu. Jira'yı kurup yapılandırmaya
değmeyecek işlerde — 3-4 kişilik bir ekibin bir haftalık sprint'inde, bir
bootcamp projesinde, bir staj programında — "kim ne yaptı" sorusunun cevabını
kaybetmeden hızlıca çalışmaya başlamak için.

İki şeye odaklanır:

- **Denetim izi.** Her durum değişikliği, atama, yorum ve etiket tek bir yerden
  (`lib/audit.ts`) `activity_log` tablosuna yazılır. Aktivite ekranı bunu
  kişiye ve eylem tipine göre filtreleyerek gösterir.
- **Hızlı benimseme.** Giriş yalnızca e-posta ile. Kayıt yok, davet e-postası
  yok, şifre yok. Şifre yalnızca yönetici hesaplarından istenir. Ekip
  listesinde olmayan bir e-posta giremez.

Arayüz tamamen Türkçe, mobil uyumlu, açık/koyu temaya uyum sağlıyor.

> Giriş bir kolaylık mekanizmasıdır, sert bir güvenlik sınırı değil. Panoya
> gerçekten gizli bilgi koymayın.

![Takvim görünümü](docs/screenshots/takvim-tr.png)

---

## Ekran görüntüleri

<table>
  <tr>
    <td width="50%"><a href="docs/screenshots/pano.png"><img src="docs/screenshots/pano.png" alt="Kanban pano görünümü"></a><br><sub><b>Pano görünümü</b> — Yapılacak / Devam ediyor / Bloke / Tamamlandı</sub></td>
    <td width="50%"><a href="docs/screenshots/gorev-detay.png"><img src="docs/screenshots/gorev-detay.png" alt="Görev detayı"></a><br><sub><b>Görev detayı</b> — durum, atama, etiket, yorum, görev geçmişi</sub></td>
  </tr>
  <tr>
    <td width="50%"><a href="docs/screenshots/aktivite.png"><img src="docs/screenshots/aktivite.png" alt="Aktivite kaydı"></a><br><sub><b>Aktivite</b> — kim ne yaptı, kişi ve eylem filtreli</sub></td>
    <td width="50%"><a href="docs/screenshots/ekip.png"><img src="docs/screenshots/ekip.png" alt="Ekip ekranı"></a><br><sub><b>Ekip</b> — kişi başı ilerleme; ekleme/çıkarma yalnızca yöneticide</sub></td>
  </tr>
  <tr>
    <td width="50%"><a href="docs/screenshots/giris.png"><img src="docs/screenshots/giris.png" alt="Giriş ekranı"></a><br><sub><b>Giriş</b> — şifre alanı yalnızca yönetici hesaplarında açılır</sub></td>
    <td width="50%" align="center"><a href="docs/screenshots/mobil.png"><img src="docs/screenshots/mobil.png" alt="Mobil görünüm" width="300"></a><br><sub><b>Mobil</b> — telefondan işaretlemek için</sub></td>
  </tr>
</table>

> Görsellerdeki veri depodaki `sprint.config.ts` örneğinin aynısı — klonlayıp
> tohumladığında bu ekranları birebir görürsün.
>
> Yukarıdaki ilk görsel arayüz Türkçe'ye çevrilmiş halini, tablodaki diğerleri
> İngilizce halini gösteriyor. Örnek yapılandırma `defaultLocale: 'en'` ile
> geldiği için içerik İngilizce; arayüzü 🌐 düğmesiyle çevirdiğinde görev
> başlıkları olduğu gibi kalır, yalnızca panonun kendi metinleri değişir.

---

## Neler var

**İki görünüm, tek tuşla geçiş.** Takvim görünümü sprint'i gün sekmelerine
böler; her gün içinde track (iş kolu) blokları durur. Kanban görünümü aynı
görevleri **Yapılacak / Devam ediyor / Bloke / Tamamlandı** kolonlarına dizer.
Seçim `localStorage`'da saklanır, bir dahaki gelişte aynı görünüm açılır.

**Tek tıkla tamamlama.** Görev kartındaki kutuyu işaretlemek yeter; detay
ekranını açmaya gerek yok.

**Atama ile devralma ayrı kaydedilir.** Devralınabilir bir işi (yani
`origin_track` taşıyan bir görevi) kendine almak aktivite kaydına *claim*,
başkasına atamak *assign* olarak düşer — "kim gönüllü oldu" ile "kime verildi"
karışmaz.

**Yorum ve `@ad` etiketleme.** Yorum yazarken `@` sonrası ekip üyesi adları
otomatik tamamlanır; eşleşen isimler `mentions` tablosuna işlenir. Eşleştirme
Türkçe karakterlere ve büyük/küçük harfe duyarsızdır, üç kelimeye kadar ad
yakalar (`@Ayşe`, `@Ayşe Yılmaz`).

**Serbest etiketler.** Sabit bir liste yok; ihtiyaç duyulan etiket anında
eklenir ve `lib/labels.ts` üzerinden küçük harfe normalize edilir — "ACİL" ile
"acil" aynı etiket sayılır.

**Panoda öne çıkanlar.** `is_blocker` işaretli görevler bloker olarak
vurgulanır. `origin_track` taşıyan görevler "devralınabilir işler" olarak ayrı
gösterilir — bir track'in kapasitesi bittiğinde iş başka bir track'e açılır.

**Kutudan iki dilli.** Türkçe ve İngilizce, üst çubuktaki tek düğmeyle
değişiyor ve seçim kişi başına hatırlanıyor. Kendi içeriğin hiç çevrilmiyor —
bkz. [Dil](#dil).

**Yetki modeli sade.** Görev oluşturmayı, durum değiştirmeyi, atamayı ve yorumu
herkes yapar. Silme ve kişi yönetimi yalnızca yöneticide. (Tam tablo aşağıda.)

**Terminalden de kullanılır.** Depo bir MCP sunucusu içeriyor: Claude Code,
Codex ve OpenCode panoyu doğrudan okuyup güncelleyebilir. Ajanın yaptığı
değişiklikler de aynı aktivite kaydına düşer. Bkz. [`mcp/README.md`](mcp/README.md).

---

## 5 dakikada ayağa kaldır

Vercel + Neon üzerinden en kısa yol. Yerel bir veritabanına ihtiyaç yok.

### 1. Depoyu al ve Vercel'e bağla

```bash
git clone <depo-adresi> sprint-board
cd sprint-board
npm install
npx vercel link
```

### 2. Neon veritabanını bağla

Vercel panelinde **Storage → Marketplace → Neon** üzerinden bir veritabanı
oluşturup projeye bağlayın. Entegrasyon `DATABASE_URL`'i ortam değişkeni olarak
otomatik enjekte eder; elle eklemenize gerek yok.

### 3. Kalan üç değişkeni ekle

```bash
npx vercel env add SESSION_SECRET production --value "$(openssl rand -base64 32)"
npx vercel env add ADMIN_PASSWORD  production --value "$YONETICI_SIFRESI"
npx vercel env add SEED_TOKEN      production --value "$(openssl rand -hex 24)"
```

> ⚠️ **`--value` bayrağını atlamayın.** `vercel env add NAME production`
> komutuna değeri boru hattıyla (`echo "$DEGER" | vercel env add ...`) vermek
> değişkeni **boş** kaydedebiliyor. CLI stdin'i her zaman beklendiği gibi
> okumuyor ve hata da vermiyor — sonuç, üretimde sessizce boş bir
> `SESSION_SECRET`. Değeri her zaman `--value "$DEGER"` ile geçirin.

> ⚠️ **Sensitive değişkenler `vercel env pull` ile doğrulanamaz.** Vercel'in
> gizli (sensitive) olarak sakladığı değerler geri okunamaz; `.env` dosyasına
> boş ya da maskeli düşer. "Boş görünüyor" diye yeniden yazmadan önce
> doğrulamayı **canlı bir istekle** yapın — örneğin giriş yapmayı denemek
> `SESSION_SECRET`'i, aşağıdaki tohumlama çağrısı `SEED_TOKEN`'ı test eder.

### 4. Sprint'ini tanımla

`sprint.config.ts` dosyasını kendi ekibine, günlerine ve görevlerine göre
düzenle. (Rehber bir alt bölümde.)

### 5. Deploy et ve tohumla

```bash
npx vercel deploy --prod
curl -X POST https://<projen>.vercel.app/api/seed \
  -H "x-seed-token: $SEED_TOKEN"
```

Başarılı yanıt eklenen kayıt sayılarını döner:

```json
{ "ok": true, "inserted": { "users": 3, "days": 3, "tasks": 8, "labels": 3 } }
```

Artık adrese girip e-postanızı yazarak panoyu kullanabilirsiniz.

---

## `sprint.config.ts` yapılandırma rehberi

Kök dizindeki **`sprint.config.ts` düzenleyeceğin tek dosyadır.** Tip
sözleşmesi `lib/config-types.ts`'te, çalışma zamanı doğrulaması
`lib/config.ts`'te durur.

Doğrulama **modül yüklenirken** çalışır. Bozuk bir yapılandırma sessizce garip
bir panoya değil, ilk istekte net bir hata mesajına dönüşür:

```
sprint.config.ts geçersiz:
  • Track kısaltması "DEV" iki kez kullanılmış — görev kodları çakışır.
  • "ali@ornek.com" tanımsız bir track'e bağlı: "MOBILE".
```

### Üst düzey alanlar

| Alan | Zorunlu | Ne yapar |
|---|---|---|
| `projectName` | ✅ | Sekme başlığı ve üst navigasyonda görünen ad. Boş olamaz. |
| `description` | ❌ | Kısa açıklama. |
| `timezone` | ❌ | IANA saat dilimi. Belirtilmezse `Europe/Istanbul`. |
| `defaultLocale` | ❌ | Açılış dili: `'en'` veya `'tr'`. Belirtilmezse `'en'`. |
| `tracks` | ✅ | İş kolları. En az bir tane. |
| `users` | ✅ | Giriş whitelist'i. En az biri `is_admin: true` olmalı. |
| `days` | ✅ | Sprint günleri. En az bir tane. |
| `tasks` | ✅ | Görevler (boş dizi de olabilir; panoyu uygulama içinden doldurabilirsin). |

### `tracks` — iş kolları

| Alan | Zorunlu | Kural |
|---|---|---|
| `key` | ✅ | Veritabanına yazılan anahtar. Yalnızca `A-Z`, `0-9` ve alt çizgi. Tekil. |
| `label` | ✅ | Arayüzde görünen ad. |
| `abbr` | ✅ | Görev kodlarında kullanılan kısaltma (`G1-DEV-01`). Track'ler arasında tekil — çakışırsa kodlar çakışır. |
| `color` | ✅ | Sabit paletten bir değer. |

Renk **serbest metin değil**, sekiz seçenekli sabit bir palet:
`indigo`, `teal`, `sky`, `rose`, `amber`, `violet`, `emerald`, `slate`.

Bunun nedeni Tailwind: sınıf adları derleme anında kaynak dosyalar taranarak
üretilir, çalışma zamanında `bg-${renk}-100` gibi bir dizi kurmak boş bir stil
üretir. Palet karşılıkları `lib/config.ts` içinde birebir yazılıdır.

### `users` — giriş whitelist'i

| Alan | Zorunlu | Kural |
|---|---|---|
| `email` | ✅ | Küçük harfe çevrilir. Giriş bu listeye göre yapılır: listede yoksa giriş yok. |
| `name` | ✅ | `@ad` etiketlemesi bu adı arar. Adların ilk kelimeleri farklı olsun: iki kişi de "Ali" ile başlarsa `@Ali` hangisini kastettiğini ayırt edemez. |
| `track` | ✅ | `tracks` içindeki bir `key`. |
| `is_admin` | ❌ | `true` ise girişte `ADMIN_PASSWORD` sorulur; silme ve kişi yönetimi yetkisi açılır. En az bir kişide `true` olmalı. |

### `days` — sprint günleri

| Alan | Zorunlu | Kural |
|---|---|---|
| `day_no` | ✅ | Pozitif tam sayı, tekil. Gün sekmeleri bu sıraya göre dizilir. |
| `date` | ✅ | `YYYY-MM-DD`. |
| `weekday` | ✅ | Gün adı (`Pazartesi`). |
| `theme` | ✅ | Günün teması — sekme başlığının altında görünür. Boş olamaz. |
| `milestone` | ❌ | Doldurulursa o gün milestone olarak işaretlenir. |

### `tasks` — görevler

| Alan | Zorunlu | Kural |
|---|---|---|
| `code` | ✅ | Görevin kalıcı kimliği ve URL'i (`/task/G1-DEV-01`). Tekil. **Tohumladıktan sonra değiştirme.** |
| `day_no` | ✅ | `days` içindeki bir `day_no`. |
| `track` | ✅ | `tracks` içindeki bir `key` — görevin şu anki sahibi. |
| `title` | ✅ | Boş olamaz. |
| `origin_track` | ❌ | Devralınan işlerde işin geldiği track. Panoda "devralınabilir" olarak gösterilir. |
| `detail` | ❌ | Uzun açıklama. |
| `output` | ❌ | Görevin somut çıktısı — "bitti" tanımını netleştirir. |
| `status` | ❌ | `todo` \| `in_progress` \| `blocked` \| `done`. Belirtilmezse `todo`. |
| `assignee` | ❌ | `users` içindeki bir e-posta. Boş bırakılırsa görev sahipsiz açılır. |
| `is_blocker` | ❌ | `true` ise panoda bloker olarak öne çıkar. |
| `labels` | ❌ | Serbest etiketler; küçük harfe çevrilir. |

### Küçük bir örnek

```ts
import type { SprintConfig } from './lib/config-types';

const config: SprintConfig = {
  projectName: 'Sprint Panosu',
  description: 'Ekibin sprint takip panosu — kim ne yapıyor, ne kaldı.',

  tracks: [
    { key: 'DEV', label: 'Geliştirme', abbr: 'DEV', color: 'indigo' },
    { key: 'DESIGN', label: 'Tasarım', abbr: 'DSG', color: 'teal' },
  ],

  users: [
    { email: 'deniz@ornek.com', name: 'Deniz Kaya', track: 'DEV', is_admin: true },
    { email: 'ege@ornek.com', name: 'Ege Demir', track: 'DEV' },
  ],

  days: [
    { day_no: 1, date: '2026-07-30', weekday: 'Perşembe', theme: 'Kickoff ve kurulum' },
    {
      day_no: 2,
      date: '2026-07-31',
      weekday: 'Cuma',
      theme: 'Demo ve kapanış',
      milestone: 'Sprint bitişi — demo canlı',
    },
  ],

  tasks: [
    {
      code: 'G1-DEV-01',
      day_no: 1,
      track: 'DEV',
      title: 'Veri şemasını oluştur',
      output: 'Uygulanmış şema',
      is_blocker: true,
      assignee: 'ege@ornek.com',
      labels: ['bloker'],
    },
    {
      code: 'G2-DSG-01',
      day_no: 2,
      track: 'DESIGN',
      origin_track: 'DEV',
      title: 'Boş durum ekranlarını tasarla',
      status: 'in_progress',
    },
  ],
};

export default config;
```

---

## Ortam değişkenleri

| Değişken | Zorunlu | Ne için |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon Postgres bağlantısı. Vercel'in Neon entegrasyonu otomatik enjekte eder. |
| `SESSION_SECRET` | ✅ | JWT imza anahtarı. `openssl rand -base64 32` ile üret. |
| `ADMIN_PASSWORD` | ✅ | Yönetici hesaplarının giriş şifresi. |
| `SEED_TOKEN` | ✅ | `POST /api/seed` çağrısını korur. |
| `NEON_LOCAL_PROXY` | ❌ | Yalnızca lokal geliştirmede. Üretimde tanımlamayın. |

Şablon için `.env.example` dosyasına bakın.

---

## Tohumlama

`POST /api/seed` iki iş yapar:

1. Şemayı kurar. Tüm `CREATE` ifadeleri `IF NOT EXISTS` — var olan tablolara
   dokunmaz. Şemanın tek kaynağı `lib/schema.ts` içindeki `SCHEMA_SQL`.
2. `sprint.config.ts` içeriğini `users`, `sprint_days`, `tasks` ve
   `task_labels` tablolarına `ON CONFLICT DO NOTHING` ile yazar.

Uç nokta `x-seed-token` başlığını `SEED_TOKEN` ile karşılaştırır; eşleşmezse
`403` döner. Oturum gerektirmez (`proxy.ts` bunu açık uçlar listesinde tutar),
o yüzden `SEED_TOKEN`'ı tahmin edilebilir bırakmayın.

```bash
# Üretim
curl -X POST https://<projen>.vercel.app/api/seed \
  -H "x-seed-token: $SEED_TOKEN"

# Lokal
curl -X POST http://localhost:3000/api/seed \
  -H "x-seed-token: $SEED_TOKEN"
```

> ⚠️ **Tekrar çağırmak güvenli, ama mevcut kayıtları GÜNCELLEMEZ.**
> `ON CONFLICT DO NOTHING` yalnızca yeni satır ekler. `sprint.config.ts`'i
> tohumladıktan sonra bir görevin başlığını değiştirirsen, o değişiklik canlı
> panoya **yansımaz** — yeni eklediğin satırlar eklenir, mevcutlar olduğu gibi
> kalır. Var olan bir kaydı düzeltmek istiyorsan panonun kendi arayüzünden
> düzenle ya da veritabanında elle güncelle.

---

## Lokal geliştirme

Bir tuzak var: **Neon'un HTTP sürücüsü düz bir Postgres'e bağlanamaz.** SQL'i
HTTP üzerinden konuşur, protokol uyuşmaz. Lokalde araya Neon'un HTTP
protokolünü konuşan bir proxy koymak gerekir — yani iki konteyner.

### 1. Postgres ve Neon HTTP proxy'sini çalıştır

```bash
docker run -d --name sb-pg \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sprintboard \
  -p 5432:5432 postgres:16-alpine

docker run -d --name sb-neon-proxy \
  -p 4444:4444 \
  -e PG_CONNECTION_STRING=postgres://postgres:postgres@host.docker.internal:5432/sprintboard \
  ghcr.io/timowilhelm/local-neon-http-proxy:main
```

### 2. `.env.local` dosyasını oluştur

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/sprintboard
NEON_LOCAL_PROXY=http://localhost:4444/sql
SESSION_SECRET=<openssl rand -base64 32 çıktısı>
ADMIN_PASSWORD=<kendi lokal şifren>
SEED_TOKEN=<openssl rand -hex 24 çıktısı>
```

`NEON_LOCAL_PROXY` tanımlıysa `lib/db.ts` sürücünün `fetchEndpoint`'ini bu
adrese çevirir ve güvenli WebSocket'i kapatır. Üretimde bu değişken olmadığı
için davranış hiç değişmez.

### 3. Sunucuyu çalıştır ve tohumla

```bash
npm install
npm run dev
curl -X POST http://localhost:3000/api/seed -H "x-seed-token: $SEED_TOKEN"
```

Kullanılabilir script'ler: `npm run dev`, `npm run build`, `npm run start`,
`npm run lint`.

Temizlik:

```bash
docker rm -f sb-pg sb-neon-proxy
```

---

## MCP: panoyu terminalden kullan

Depo bir **stdio MCP sunucusu** içeriyor (`mcp/`). Claude Code, Codex ve
OpenCode panoyu doğrudan okuyup güncelleyebilir — tarayıcıya geçmeye gerek yok:

```
> bugün bana ne kaldı?
> G2-DEV-01'i tamamlandı işaretle
> şemayla ilgili yorumda @Deniz'i etiketle
```

Beş okuma aracı (`list_tasks`, `get_task`, `sprint_summary`, `list_activity`,
`list_people`) ve beş yazma aracı (`set_task_status`, `assign_task`,
`create_task`, `add_comment`, `set_task_labels`) var. **Silme aracı bilinçli
olarak yok** — bir ajanın yanlış anlamayla veri silmesini istemiyoruz.

Ajanın yaptığı her değişiklik, panodan yapılmış gibi aynı aktivite kaydına,
`SPRINT_BOARD_ACTOR` olarak tanımladığın kişinin adına düşer.

Kurulum ve üç araç için hazır yapılandırma: [`mcp/README.md`](mcp/README.md).

---

## Dil

Arayüz **Türkçe ve İngilizce** geliyor; sağ üstteki 🌐 düğmesiyle herkes
değiştirebilir. Seçim `sb_locale` çerezinde saklanıyor, yani sayfa yenilenince
kaybolmuyor ve sunucu da aynı değeri okuyor — sayfalar ilk baytta doğru dilde
çiziliyor, yanlış metnin bir an görünüp değişmesi diye bir şey yok.

Kişinin ilk gördüğü dili `sprint.config.ts` içindeki `defaultLocale` belirliyor
(`'en'` veya `'tr'`); kendisi bir seçim yapana kadar.

**Çevrilen:** uygulamanın kendi söyledikleri — gezinme, düğmeler, durum adları,
form etiketleri, boş durumlar ve API'nin döndürdüğü hata mesajları.

**Çevrilmeyen:** senin içeriğin. Görev başlıkları, açıklamalar, track adları,
gün temaları, yorumlar ve etiketler `sprint.config.ts`'ten ya da panoyu
kullanan kişilerden geliyor ve yazıldığı gibi gösteriliyor. Türkçe görev yazıp
İngilizce arayüz kullanmak desteklenen bir birleşim; pano hiçbir şeyi makine
çevirisine sokmuyor.

Bilinmesi gereken bir ayrıntı: `days` girdilerinde `weekday` alanını **boş
bırak**. Yazılmazsa gün adı tarihten ve aktif dilden türetiliyor, yani arayüz
İngilizce'ye çevrildiğinde "Perşembe" de "Thursday" oluyor. Sabit bir etiket
istiyorsan yaz.

Üçüncü bir dil eklemek üç adım: `lib/i18n/locales.ts` içindeki `LOCALES`'e
anahtarı ekle, `lib/i18n/sections/` altındaki her dosyaya o anahtarı ekle, ve
`app/format.ts` içine ay/gün adlarını yaz. Her bölümde yeni dil olmadan
TypeScript derlemiyor, yani yarım çeviriyle yayına çıkmak mümkün değil.

---

## Yetki modeli

| İşlem | Herkes | Yönetici |
|---|---|---|
| Giriş (yalnızca e-posta) | ✅ | — |
| Giriş (e-posta + `ADMIN_PASSWORD`) | — | ✅ |
| Panoyu ve görev detaylarını görme | ✅ | ✅ |
| Görev oluşturma | ✅ | ✅ |
| Durum değiştirme / tek tıkla tamamlama | ✅ | ✅ |
| Görev atama ve kendine alma | ✅ | ✅ |
| Yorum yazma ve `@ad` ile etiketleme | ✅ | ✅ |
| Etiket ekleme / kaldırma | ✅ | ✅ |
| Aktivite kaydını görüntüleme | ✅ | ✅ |
| **Görev silme** | ❌ | ✅ |
| **Ekibe kişi ekleme / çıkarma** | ❌ | ✅ |

Yetki kontrolü iki katmanda yapılır: `proxy.ts` oturumsuz istekleri en başta
keser, route handler'lar ise yönetici gerektiren işlemlerde ayrıca kontrol eder
— yani proxy'ye güvenilmez. Yapılandırmada `is_admin: true` olan hesaplar
panodan çıkarılamaz.

---

## Proje yapısı

```
sprint.config.ts          ← düzenleyeceğin tek dosya
proxy.ts                  Rota koruması (Next.js 16'da middleware'in adı)

lib/
  config-types.ts         sprint.config.ts'in tip sözleşmesi
  config.ts               Çalışma zamanı doğrulaması + türetilmiş sabitler, renk paleti
  schema.ts               SCHEMA_SQL — veritabanı şemasının tek kaynağı
  db.ts                   Neon HTTP bağlantısı (tembel başlatılır)
  session.ts              JWT imzalama/doğrulama + çerez yönetimi
  audit.ts                logActivity — tek audit yazma noktası
  i18n/                   İki dilli arayüz: sözlükler, dil çözümlemesi, provider
  labels.ts               Etiket normalizasyonu (Türkçe "İ" dahil)
  types.ts                Veritabanı satırı ve API sözleşmesi tipleri

app/
  page.tsx                Pano (takvim ↔ kanban)
  giris/page.tsx          Giriş ekranı
  task/[code]/page.tsx    Görev detayı
  aktivite/page.tsx       Aktivite kaydı (kişi + eylem filtreli)
  ekip/page.tsx           Ekip listesi ve yönetimi
  board-data.ts           Sunucu tarafı okuma katmanı — yalnızca SELECT
  format.ts               Türkçe tarih/metin biçimlendirme (sabit saat dilimi)
  components/             Arayüz bileşenleri (kart, detay, kanban, yorum kutusu…)
  api/
    auth/login            GET: şifre gerekiyor mu? · POST: giriş
    auth/logout           POST: çıkış
    board                 GET: pano verisi
    tasks                 GET, POST: liste ve oluşturma
    tasks/[id]            PATCH: durum/atama · DELETE: silme (yönetici)
    tasks/[id]/comments   GET, POST: yorum + mention
    tasks/[id]/labels     POST, DELETE: etiket
    users                 GET · POST/DELETE: kişi yönetimi (yönetici)
    seed                  POST: şema + tohumlama (x-seed-token)

mcp/
  server.js               stdio MCP sunucusu (Claude Code · Codex · OpenCode)
  README.md               Kurulum, araç listesi, yetki notları
.mcp.json.example         Claude Code için hazır yapılandırma
```

Mimarinin iki kuralı:

- **Okuma sunucudan, yazma API'den.** Sayfalar `app/board-data.ts` üzerinden
  doğrudan Neon'a `SELECT` atar (kendi origin'ine fetch atıp çerez taşımaz).
  Her mutasyon istemciden `/api/*` uçlarına gider.
- **Tek audit noktası.** Her mutasyon route'u `lib/audit.ts`'teki
  `logActivity` fonksiyonunu çağırır. Böylece log'lanmayan bir aksiyon kalmaz.

---

## Veri modeli

Yedi tablo. Şemanın tek kaynağı `lib/schema.ts`; tüm `CREATE`'ler
`IF NOT EXISTS` olduğu için tohumlama tekrar çağrılabilir.

| Tablo | Ne tutar | Notlar |
|---|---|---|
| `users` | E-posta (PK), ad, track, `is_admin` | Giriş whitelist'i. Kişi silinirse görevleri sahipsiz kalır (`ON DELETE SET NULL`). |
| `sprint_days` | `day_no` (PK), tarih, gün adı, tema, milestone | Gün sekmeleri. |
| `tasks` | `code` (UNIQUE), gün, track, `origin_track`, başlık, açıklama, çıktı, durum, atanan, `is_blocker`, sıra, tamamlama bilgisi | `code` kalıcı kimlik ve URL. |
| `task_labels` | (`task_id`, `label`) | Bileşik PK; aynı etiket iki kez eklenemez. Görev silinirse birlikte gider. |
| `comments` | Görev, yazar, gövde, zaman | |
| `mentions` | Yorum, görev, etiketlenen kişi, `seen` | Yorum gövdesindeki `@ad` çözümlemesinden üretilir. |
| `activity_log` | Aktör, eylem, görev, eski/yeni değer, not, zaman | Tek yazma noktası `lib/audit.ts`. Görev silinse bile kayıt kalır — bu yüzden FK yok. |

Eylem tipleri: `login`, `status`, `assign`, `claim`, `comment`, `label`,
`create`, `delete`, `user_add`, `user_remove`.

---

## API uçları

Hepsi oturum ister; `proxy.ts` oturumsuz istekleri en başta keser. Yönetici
gerektiren uçlar route handler içinde ayrıca kontrol edilir.

| Metot | Uç | Kim | Ne yapar |
|---|---|---|---|
| `GET` | `/api/auth/login?email=` | herkes | Bu e-posta için şifre gerekiyor mu? |
| `POST` | `/api/auth/login` | herkes | Giriş; yöneticide `password` zorunlu |
| `POST` | `/api/auth/logout` | oturum | Çerezi siler |
| `GET` | `/api/board` | oturum | Panonun ihtiyaç duyduğu her şey tek yanıtta |
| `POST` | `/api/tasks` | oturum | Görev oluşturur; kod otomatik üretilir |
| `PATCH` | `/api/tasks/[id]` | oturum | `title`, `detail`, `output`, `day_no`, `status`, `assignee` — yalnızca gönderilen alanlar değişir |
| `DELETE` | `/api/tasks/[id]` | **yönetici** | Görevi siler |
| `GET` `POST` | `/api/tasks/[id]/comments` | oturum | Yorumlar; `@ad` mention'a çevrilir |
| `POST` `DELETE` | `/api/tasks/[id]/labels` | oturum | Etiket ekler/çıkarır |
| `GET` | `/api/activity` | oturum | Aktivite kaydı |
| `GET` | `/api/users` | oturum | Ekip listesi |
| `POST` `DELETE` | `/api/users` | **yönetici** | Kişi ekler/çıkarır |
| `POST` | `/api/locale` | herkes | Arayüz dili tercihini saklar (oturum gerekmez) |
| `POST` | `/api/seed` | `x-seed-token` | Şema + tohumlama (oturum gerekmez) |

---

## Sorun giderme

**`/api/seed` 403 dönüyor.** `SEED_TOKEN` sunucuda tanımsız ya da başlıktaki
değerle eşleşmiyor. Vercel'de değeri boru hattıyla eklediysen boş kaydedilmiş
olabilir — `--value` bayrağıyla tekrar ekle. Değişkeni değiştirdikten sonra
yeniden deploy etmen gerekir.

**Girişte 500 alıyorum.** Genellikle `SESSION_SECRET` boş. Yukarıdaki `--value`
tuzağına bak; `vercel env pull` ile doğrulamaya çalışma, sensitive değerler boş
görünür.

**`fetch failed` / bağlantı hatası, lokalde.** Neon HTTP sürücüsü düz
Postgres'e bağlanamaz. İki konteynerin ayakta olduğundan ve `.env.local`
içinde `NEON_LOCAL_PROXY` tanımlı olduğundan emin ol.

**`sprint.config.ts geçersiz: …` hatası.** Doğrulama modül yüklenirken koşar ve
tüm sorunları tek seferde listeler. Mesajdaki maddeleri düzelt; hepsi düzelene
kadar uygulama açılmaz. Bu bilinçli: yarım yapılandırmayla sessizce garip
davranan bir pano istemiyoruz.

**Tohumladım ama değişikliğim panoda yok.** `ON CONFLICT DO NOTHING` mevcut
kayıtları güncellemez. Var olan bir görevi düzeltmek için panoyu ya da
veritabanını kullan.

**Görev kartındaki track rengi gri çıkıyor.** Veritabanındaki track,
yapılandırmadan kaldırılmış. `trackStyle` bilinmeyen değerlerde çökmez, nötr
gri döner. Kaldırdığın track'i geri ekle ya da o görevleri başka bir track'e taşı.

**MCP: `"…" panoda kayıtlı değil`.** `SPRINT_BOARD_ACTOR` yapılandırmadaki bir
e-posta olmalı. Yazma işlemleri bu kişi adına kaydedildiği için zorunlu.

---

## Bilinçli olarak yok

Bunlar eksik değil, kapsam dışı — küçük ekipte karşılığını vermeyen
karmaşıklık:

- **Sürükle-bırak.** Durum değiştirmek tek tık; kanban kolonları arasında
  taşıma yok.
- **Bildirim.** E-posta ya da push yok. Mention'lar `mentions` tablosunda
  duruyor; bildirim isteyen bunun üzerine kurabilir.
- **Sprint geçmişi.** Tek sprint tutulur. Yeni sprint = yeni yapılandırma ve
  temiz veritabanı.
- **Rol/izin sistemi.** İki seviye var: herkes ve yönetici. Aradaki ince
  ayarlar yok.
- **Gerçek kimlik doğrulama.** E-posta doğrulanmaz. Amaç denetim izi, erişim
  kontrolü değil.

---

## Kendi projene uyarlarken dikkat

- **`code` alanlarını tohumladıktan sonra değiştirme.** Görev kodu kalıcı
  kimliktir ve URL'de geçer (`/task/G1-DEV-01`). Değiştirirsen eski bağlantılar
  kırılır, tohumlama da eski kaydı silmeyip yenisini ekler.
- **`sprint.config.ts` düzenlemeleri canlı veriye yansımaz.** Tohumlama
  yalnızca ekler. Sprint başladıktan sonraki değişiklikleri panodan yapın.
- **Track rengi paletin dışına çıkamaz.** Yeni bir renk istiyorsan
  `lib/config.ts` içindeki `PALETTE` sabitine sınıf adlarını **elle** yaz ve
  `lib/config-types.ts`'teki `TrackColor` birleşimine ekle. Tailwind sınıflarını
  çalışma zamanında birleştirmek işe yaramaz.
- **`abbr` değerlerini tekil tut.** İki track aynı kısaltmayı kullanırsa
  otomatik üretilen görev kodları çakışır — doğrulama bunu zaten reddeder.
- **En az bir `is_admin: true` hesap bırak.** Aksi halde kimse görev silemez ve
  ekibe kişi ekleyemez; doğrulama da hata verir.
- **`SESSION_SECRET`'i değiştirmek herkesi çıkışa zorlar.** Mevcut çerezler
  doğrulanamaz hale gelir.
- **Giriş bir güvenlik sınırı değil.** E-posta doğrulanmıyor; listedeki bir
  adresi bilen herkes o kişi olarak girebilir. Amaç denetim izi, erişim
  kontrolü değil.
- **Saat dilimi yapılandırmadan gelir, makineden değil.** Varsayılan
  `Europe/Istanbul`; değiştirmek için `sprint.config.ts` içine
  `timezone: 'Europe/Berlin'` yaz. Sabit olması bilinçli: sunucu ile istemci
  aynı tarihi üretmezse React hydration uyuşmazlığı çıkar.
- **MCP `DATABASE_URL` ile çalışır, yani tam yetkilidir.** Bağlantı adresini
  paylaşmak panonun tamamını paylaşmaktır; ayrıntı `mcp/README.md` içinde.

---

## Teknoloji notları

- **Next.js 16** (App Router) · **React 19** · **TypeScript** · **Tailwind CSS v4**
- **Neon Postgres**, `@neondatabase/serverless` HTTP sürücüsüyle. `lib/db.ts`
  bağlantıyı tembel kurar — derleme sırasında `DATABASE_URL` tanımsız olabilir,
  bu yüzden bağlantı ilk sorguya kadar açılmaz.
- **Oturum: `jose` ile HS256 imzalı JWT**, `sb_session` adlı httpOnly çerezde,
  30 gün ömürlü. NextAuth **kullanılmıyor**; harici bir kimlik sağlayıcı yok.
- **`proxy.ts`, `middleware.ts` değil.** Next.js 16'da middleware dosyasının
  adı `proxy.ts`, dışa açılan fonksiyonun adı da `proxy` olmak zorunda. Eski
  `middleware.ts` / `export function middleware` ikilisini kopyalarsanız rota
  koruması sessizce hiç çalışmaz. Bu proxy yalnızca `nodejs` runtime'ında
  çalışır (`jose` bunu gerektirir) ve **veritabanına dokunmaz** — sadece JWT
  doğrular; asıl yetki kontrolü route handler'larda.
- **Tailwind v4** yapılandırmayı PostCSS üzerinden alır
  (`@tailwindcss/postcss`); `tailwind.config.js` dosyası yok.

---

## Katkı

Bkz. [CONTRIBUTING.md](CONTRIBUTING.md). CI her push'ta `npm run lint` ve
`npm run build` koşar; MCP sunucusunun sözdizimini ve eksik ortam değişkeni
davranışını da ayrıca sınar.

## Lisans

MIT — bkz. [LICENSE](LICENSE).
