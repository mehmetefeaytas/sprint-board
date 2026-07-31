// Her yerde geçen metinler: durum adları, düğmeler, genel hata mesajları.
//
// Bölüm dosyalarının kalıbı: `tr` yazılır, tipi ondan türetilir, `en` o tipe
// uymak zorundadır. Böylece bir dilde eksik veya fazla anahtar derlemede hata
// verir — çeviri sessizce yarım kalamaz.

const tr = {
  status: {
    todo: 'Yapılacak',
    in_progress: 'Devam ediyor',
    blocked: 'Bloke',
    done: 'Tamamlandı',
  },
  action: {
    save: 'Kaydet',
    cancel: 'İptal',
    add: 'Ekle',
    remove: 'Kaldır',
    delete: 'Sil',
    close: 'Kapat',
    retry: 'Tekrar dene',
  },
  state: {
    loading: 'Yükleniyor…',
    saving: 'Kaydediliyor…',
    empty: 'Kayıt yok.',
  },
  error: {
    generic: 'Bir şeyler ters gitti.',
    network: 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edin.',
    notFound: 'Sayfa bulunamadı.',
  },
  language: 'Dil',
  unassigned: 'Atanmadı',
  blocker: 'BLOKER',
  today: 'BUGÜN',
  milestone: 'Kilometre taşı',
  comments: (count: number) => `${count} yorum`,
  taskCount: (count: number) => (count === 1 ? '1 görev' : `${count} görev`),
  doneOfTotal: (done: number, total: number) => `${done} / ${total} tamamlandı`,
  percent: (value: number) => `%${value}`,
};

export type CommonDict = typeof tr;

const en: CommonDict = {
  status: {
    todo: 'To do',
    in_progress: 'In progress',
    blocked: 'Blocked',
    done: 'Done',
  },
  action: {
    save: 'Save',
    cancel: 'Cancel',
    add: 'Add',
    remove: 'Remove',
    delete: 'Delete',
    close: 'Close',
    retry: 'Try again',
  },
  state: {
    loading: 'Loading…',
    saving: 'Saving…',
    empty: 'Nothing here yet.',
  },
  error: {
    generic: 'Something went wrong.',
    network: "Couldn't reach the server. Check your connection.",
    notFound: 'Page not found.',
  },
  language: 'Language',
  unassigned: 'Unassigned',
  blocker: 'BLOCKER',
  today: 'TODAY',
  milestone: 'Milestone',
  comments: (count: number) => (count === 1 ? '1 comment' : `${count} comments`),
  taskCount: (count: number) => (count === 1 ? '1 task' : `${count} tasks`),
  doneOfTotal: (done: number, total: number) => `${done} / ${total} done`,
  percent: (value: number) => `${value}%`,
};

export const common = { tr, en };
