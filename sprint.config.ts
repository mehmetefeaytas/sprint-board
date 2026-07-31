// ─────────────────────────────────────────────────────────────────────────────
// PANOYU KENDİ PROJENE UYARLAMAK İÇİN DÜZENLEYECEĞİN TEK DOSYA.
//
// Buradaki içerik örnektir: 3 track, 3 kişi, 3 gün, 8 görev. Kendi sprint'ine
// göre değiştir, sonra POST /api/seed çağır (bkz. README).
//
// Tohumlama ON CONFLICT DO NOTHING ile çalışır: tekrar çağırmak güvenlidir,
// ama var olan kayıtları GÜNCELLEMEZ. Yani bu dosyayı tohumladıktan sonra
// değiştirirsen, değişiklik canlı panoya kendiliğinden yansımaz — yeni
// eklediğin satırlar eklenir, mevcutlar olduğu gibi kalır.
//
// Alanların tam açıklaması: lib/config-types.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { SprintConfig } from './lib/config-types';

const config: SprintConfig = {
  projectName: 'Sprint Panosu',
  description: 'Ekibin sprint takip panosu — kim ne yapıyor, ne kaldı.',
  // Tarih ve saatler bu dilimde gösterilir. Belirtilmezse 'Europe/Istanbul'.
  timezone: 'Europe/Istanbul',

  // Track = iş kolu. `abbr` görev kodlarında kullanılır, tekil olmalı.
  tracks: [
    { key: 'DEV', label: 'Geliştirme', abbr: 'DEV', color: 'indigo' },
    { key: 'DESIGN', label: 'Tasarım', abbr: 'DSG', color: 'teal' },
    { key: 'OPS', label: 'DevOps / QA', abbr: 'OPS', color: 'rose' },
  ],

  // En az bir kişi `is_admin: true` olmalı. Yöneticiden girişte
  // ADMIN_PASSWORD istenir; diğerleri yalnızca e-posta yazarak girer.
  users: [
    // Adlar farklı kelimelerle başlasın: yorumlarda "@Deniz" yazan kişi
    // tek bir kişiyi etiketler. İki kişi de "Örnek" ile başlarsa hangisinin
    // kastedildiği belirsiz kalır.
    { email: 'deniz@ornek.com', name: 'Deniz Kaya', track: 'DEV', is_admin: true },
    { email: 'ege@ornek.com', name: 'Ege Demir', track: 'DEV' },
    { email: 'nil@ornek.com', name: 'Nil Aydın', track: 'DESIGN' },
  ],

  // Tarihler yer tutucu — kendi sprint'inin tarihleriyle değiştir. Geçmiş
  // tarih bırakırsan pano üstte "Demo tarihi geçti" uyarısı gösterir.
  days: [
    { day_no: 1, date: '2026-07-30', weekday: 'Perşembe', theme: 'Kickoff ve kurulum' },
    { day_no: 2, date: '2026-07-31', weekday: 'Cuma', theme: 'Uçtan uca akış' },
    {
      day_no: 3,
      date: '2026-08-03',
      weekday: 'Pazartesi',
      theme: 'Demo ve kapanış',
      milestone: 'Sprint bitişi — demo canlı',
    },
  ],

  // `code` görevin kalıcı kimliğidir ve URL'e girer (/task/G1-DEV-01);
  // tohumladıktan sonra değiştirme. Panodan açılan görevler
  // G{gün}-{abbr}-{sıra} biçiminde otomatik kod alır; aynı kuralı
  // izlemek listeyi okunur tutar.
  tasks: [
    {
      code: 'G1-DEV-01',
      day_no: 1,
      track: 'DEV',
      title: 'Depoyu kur ve geliştirme ortamını ayağa kaldır',
      detail: 'Bağımlılıkları kur, ortam değişkenlerini doldur, lokal sunucuyu çalıştır.',
      output: 'Çalışan lokal ortam',
      status: 'done',
      assignee: 'ege@ornek.com',
    },
    {
      code: 'G1-DSG-01',
      day_no: 1,
      track: 'DESIGN',
      title: 'Ana ekran taslağını çıkar',
      detail: 'Düşük çözünürlüklü wireframe; ekip üzerinde konuşup onaylayacak.',
      output: 'Onaylanmış wireframe',
      status: 'in_progress',
      assignee: 'nil@ornek.com',
      labels: ['tasarım'],
    },
    {
      code: 'G1-OPS-01',
      day_no: 1,
      track: 'OPS',
      title: 'CI hattını kur',
      detail: 'Her push\'ta derleme ve testler çalışsın.',
      output: 'Yeşil CI koşusu',
      assignee: 'deniz@ornek.com',
    },
    {
      code: 'G2-DEV-01',
      day_no: 2,
      track: 'DEV',
      title: 'Veri şemasını oluştur',
      detail: 'Tablolar, ilişkiler ve indeksler. Bu iş bitmeden API yazılamaz.',
      output: 'Uygulanmış şema',
      is_blocker: true,
      assignee: 'ege@ornek.com',
      labels: ['bloker'],
    },
    {
      code: 'G2-DEV-02',
      day_no: 2,
      track: 'DEV',
      title: 'API uçlarını yaz',
      detail: 'Listeleme, oluşturma ve güncelleme uçları + yetki kontrolü.',
      output: 'Çalışan API',
    },
    {
      code: 'G2-DSG-01',
      day_no: 2,
      track: 'DESIGN',
      origin_track: 'DEV',
      title: 'Boş durum ve hata ekranlarını tasarla',
      detail: 'Geliştirme track\'inden devralındı: kapasite tasarım tarafında açıldı.',
      output: 'Boş durum + hata ekranı',
      labels: ['devralma'],
    },
    {
      code: 'G3-OPS-01',
      day_no: 3,
      track: 'OPS',
      title: 'Demo öncesi duman testi',
      detail: 'Kritik akışları elle geç, bulguları görev olarak aç.',
      output: 'Duman testi notu + bulgu listesi',
    },
    {
      code: 'G3-DEV-01',
      day_no: 3,
      track: 'DEV',
      title: 'Demo ve retrospektif',
      detail: 'Canlı demo, kabul kriterleri kontrolü, sonraki sprint backlog\'u.',
      output: 'Kabul kaydı + backlog',
    },
  ],
};

export default config;
