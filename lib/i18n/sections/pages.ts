// Sayfa iskeletlerinin metinleri: başlıklar, başlık altı açıklamalar, veri
// okunamadığında görünen kutu başlıkları ve hata/bulunamadı ekranları.
//
// Kalıp: tr yazılır, tip ondan türetilir, en o tipe uymak zorundadır.

const tr = {
  dbError: {
    noConnection:
      'Veritabanı bağlantısı tanımlı değil (DATABASE_URL). Ortam değişkenini ekleyip sayfayı yenileyin.',
    noTables:
      'Veritabanı tabloları henüz oluşturulmamış. Bir kez /api/seed adresini çağırarak şemayı ve tohum veriyi yükleyin.',
    unreadable: (detail: string) => `Veri okunamadı: ${detail}`,
  },
  // Sekme başlıkları (generateMetadata) ve sayfa üstündeki h1'ler
  loginTitle: 'Giriş',
  activityTitle: 'Aktivite',
  teamTitle: 'Ekip',

  // Başlık altı açıklamalar
  activityIntro: (limit: number) =>
    `Kim ne yaptı — en yeni kayıt üstte. Son ${limit} hareket gösterilir.`,
  teamIntro: "Kim hangi track'te, kaç görev almış ve ne kadarını bitirmiş.",

  // Veritabanı okunamadığında görünen kutu başlıkları
  boardLoadFailed: 'Pano yüklenemedi',
  activityLoadFailed: 'Aktivite kaydı yüklenemedi',
  teamLoadFailed: 'Ekip listesi yüklenemedi',
  taskLoadFailed: 'Görev yüklenemedi',

  // error.tsx
  errorHeading: 'Bir şeyler ters gitti',
  errorBody: 'Sayfa yüklenirken beklenmeyen bir hata oluştu. Tekrar denemek sorunu çözebilir.',

  // not-found.tsx
  notFoundHeading: 'Bulunamadı',
  notFoundBody:
    'Aradığınız sayfa ya da görev kodu yok. Kod büyük harflerle yazılır, örnek: G3-DB-01.',
  backToBoard: 'Panoya dön',
};

export type PagesDict = typeof tr;

const en: PagesDict = {
  dbError: {
    noConnection:
      'No database connection configured (DATABASE_URL). Add the environment variable and reload.',
    noTables:
      'The database tables do not exist yet. Call /api/seed once to install the schema and seed data.',
    unreadable: (detail: string) => `Could not read data: ${detail}`,
  },
  loginTitle: 'Sign in',
  activityTitle: 'Activity',
  teamTitle: 'Team',

  activityIntro: (limit: number) =>
    `Who did what — newest first. Showing the last ${limit} events.`,
  teamIntro: "Who's on which track, how many tasks they picked up and how much is done.",

  boardLoadFailed: "Couldn't load the board",
  activityLoadFailed: "Couldn't load the activity log",
  teamLoadFailed: "Couldn't load the team list",
  taskLoadFailed: "Couldn't load the task",

  errorHeading: 'Something went wrong',
  errorBody: 'The page hit an unexpected error while loading. Trying again may be enough.',

  notFoundHeading: 'Not found',
  notFoundBody:
    'There is no such page or task code. Codes are uppercase, for example: G3-DB-01.',
  backToBoard: 'Back to the board',
};

export const pages = { tr, en };
