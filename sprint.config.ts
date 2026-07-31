// ─────────────────────────────────────────────────────────────────────────────
// PANOYU KENDİ PROJENE UYARLAMAK İÇİN DÜZENLEYECEĞİN TEK DOSYA.
// THE ONLY FILE YOU NEED TO EDIT TO MAKE THE BOARD YOURS.
//
// Buradaki içerik örnektir: 3 track, 3 kişi, 3 gün, 8 görev.
// The content below is an example: 3 tracks, 3 people, 3 days, 8 tasks.
//
// Arayüz iki dilli (Türkçe + İngilizce) ve kullanıcı sağ üstteki düğmeyle
// değiştirebilir. Ama BURADAKİ İÇERİK ÇEVRİLMEZ — görev başlıklarını, track
// adlarını ve temaları hangi dilde yazarsan öyle görünür.
// The UI is bilingual and users can switch it. The content in this file is NOT
// translated: task titles, track labels and themes show up exactly as written.
//
// Tohumlama ON CONFLICT DO NOTHING ile çalışır: tekrar çağırmak güvenlidir,
// ama var olan kayıtları GÜNCELLEMEZ.
// Seeding is idempotent but never UPDATES existing rows.
//
// Alanların tam açıklaması / full field reference: lib/config-types.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { SprintConfig } from './lib/config-types';

const config: SprintConfig = {
  projectName: 'Sprint Board',
  description: 'Sprint tracker for the team — who is doing what, what is left.',
  // Tarih ve saatler bu dilimde gösterilir. / Dates render in this timezone.
  timezone: 'Europe/Istanbul',
  // Açılış dili: 'tr' veya 'en'. Kullanıcının seçimi çerezde saklanır.
  // Startup language; the user's own choice is remembered in a cookie.
  defaultLocale: 'en',

  // Track = iş kolu. `abbr` görev kodlarında kullanılır, tekil olmalı.
  // A track is a lane of work. `abbr` goes into task codes and must be unique.
  tracks: [
    { key: 'DEV', label: 'Development', abbr: 'DEV', color: 'indigo' },
    { key: 'DESIGN', label: 'Design', abbr: 'DSG', color: 'teal' },
    { key: 'OPS', label: 'DevOps / QA', abbr: 'OPS', color: 'rose' },
  ],

  // En az bir kişi `is_admin: true` olmalı. Yöneticiden girişte ADMIN_PASSWORD
  // istenir; diğerleri yalnızca e-posta yazarak girer.
  // At least one person must be an admin. Admins are asked for ADMIN_PASSWORD;
  // everyone else signs in with just their email.
  //
  // Adlar farklı kelimelerle başlasın: yorumlarda "@Dana" yazan kişi tek bir
  // kişiyi etiketler. / Give people distinct first names so "@Dana" is unambiguous.
  users: [
    { email: 'dana@example.com', name: 'Dana Reed', track: 'DEV', is_admin: true },
    { email: 'kai@example.com', name: 'Kai Moreau', track: 'DEV' },
    { email: 'noor@example.com', name: 'Noor Haddad', track: 'DESIGN' },
  ],

  // `weekday` yazılmadı: gün adı tarihten ve aktif dilden türetilir, yani
  // arayüz Türkçe'ye çevrildiğinde "Thursday" da "Perşembe" olur.
  // `weekday` is omitted on purpose — it is derived from the date in the active
  // language, so switching the UI to Turkish also switches the day names.
  //
  // Tarihler yer tutucu; kendi sprint'inin tarihleriyle değiştir. Geçmiş tarih
  // bırakırsan pano üstte "demo tarihi geçti" uyarısı gösterir.
  // These dates are placeholders. Past dates make the board warn that the demo
  // date has already gone by.
  days: [
    { day_no: 1, date: '2026-07-30', theme: 'Kickoff and setup' },
    { day_no: 2, date: '2026-07-31', theme: 'End-to-end flow' },
    {
      day_no: 3,
      date: '2026-08-03',
      theme: 'Demo and wrap-up',
      milestone: 'Sprint ends — demo is live',
    },
  ],

  // `code` görevin kalıcı kimliğidir ve URL'e girer (/task/G1-DEV-01);
  // tohumladıktan sonra değiştirme. Panodan açılan görevler
  // G{gün}-{abbr}-{sıra} biçiminde otomatik kod alır.
  // `code` is the task's permanent identity and part of its URL. Don't change
  // it after seeding. Tasks created from the board get an automatic code.
  tasks: [
    {
      code: 'G1-DEV-01',
      day_no: 1,
      track: 'DEV',
      title: 'Set up the repo and get a dev environment running',
      detail: 'Install dependencies, fill in the env vars, start the local server.',
      output: 'A working local environment',
      status: 'done',
      assignee: 'kai@example.com',
    },
    {
      code: 'G1-DSG-01',
      day_no: 1,
      track: 'DESIGN',
      title: 'Draft the main screen',
      detail: 'Low-fidelity wireframe; the team will review and sign off on it.',
      output: 'An approved wireframe',
      status: 'in_progress',
      assignee: 'noor@example.com',
      labels: ['design'],
    },
    {
      code: 'G1-OPS-01',
      day_no: 1,
      track: 'OPS',
      title: 'Set up the CI pipeline',
      detail: 'Build and tests should run on every push.',
      output: 'A green CI run',
      assignee: 'dana@example.com',
    },
    {
      code: 'G2-DEV-01',
      day_no: 2,
      track: 'DEV',
      title: 'Create the data schema',
      detail: 'Tables, relations and indexes. Nothing in the API can land before this.',
      output: 'The schema applied',
      is_blocker: true,
      assignee: 'kai@example.com',
      labels: ['blocker'],
    },
    {
      code: 'G2-DEV-02',
      day_no: 2,
      track: 'DEV',
      title: 'Write the API endpoints',
      detail: 'List, create and update endpoints plus permission checks.',
      output: 'A working API',
    },
    {
      code: 'G2-DSG-01',
      day_no: 2,
      track: 'DESIGN',
      origin_track: 'DEV',
      title: 'Design the empty and error states',
      detail: 'Handed over from the development track, which ran out of capacity.',
      output: 'Empty state and error screens',
      labels: ['handover'],
    },
    {
      code: 'G3-OPS-01',
      day_no: 3,
      track: 'OPS',
      title: 'Smoke test before the demo',
      detail: 'Walk the critical paths by hand and file whatever you find as tasks.',
      output: 'Smoke test notes and a list of findings',
    },
    {
      code: 'G3-DEV-01',
      day_no: 3,
      track: 'DEV',
      title: 'Demo and retrospective',
      detail: 'Live demo, acceptance check, backlog for the next sprint.',
      output: 'Acceptance record and a backlog',
    },
  ],
};

export default config;
