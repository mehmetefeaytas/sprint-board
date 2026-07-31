// Ekip listesi ve kişi ekleme formu. Kişi adı, e-posta ve track adı kullanıcı
// içeriğidir — çevrilmez.
//
// Kalıp: tr yazılır, tip ondan türetilir, en o tipe uymak zorundadır.

const tr = {
  empty: 'Ekipte kayıtlı kişi yok.',
  adminBadge: 'yönetici',
  remove: 'Ekipten çıkar',
  removing: 'Çıkarılıyor…',
  confirmRemove: (name: string) => `${name} ekipten çıkarılsın mı?`,

  addHeading: 'Kişi ekle',
  addHint: 'Yalnızca sistem yöneticisi ekleyebilir.',
  nameLabel: 'Ad',
  emailLabel: 'E-posta',
  trackLabel: 'Track',
  adminCheckbox: 'Sistem yöneticisi',
  addSubmit: 'Ekibe ekle',
  adding: 'Ekleniyor…',
  added: (name: string) => `${name} ekibe eklendi.`,

  error: {
    nameEmailRequired: 'Ad ve e-posta zorunlu.',
    addFailed: 'Kişi eklenemedi.',
    addOffline: 'Sunucuya ulaşılamadı. Kişi eklenemedi.',
    removeFailed: 'Kişi çıkarılamadı.',
    removeOffline: 'Sunucuya ulaşılamadı. Kişi çıkarılamadı.',
  },
};

export type TeamDict = typeof tr;

const en: TeamDict = {
  empty: 'No one on the team yet.',
  adminBadge: 'admin',
  remove: 'Remove from team',
  removing: 'Removing…',
  confirmRemove: (name: string) => `Remove ${name} from the team?`,

  addHeading: 'Add someone',
  addHint: 'Only a system admin can add people.',
  nameLabel: 'Name',
  emailLabel: 'Email',
  trackLabel: 'Track',
  adminCheckbox: 'System admin',
  addSubmit: 'Add to team',
  adding: 'Adding…',
  added: (name: string) => `${name} was added to the team.`,

  error: {
    nameEmailRequired: 'Name and email are required.',
    addFailed: "Couldn't add the person.",
    addOffline: "Couldn't reach the server. The person was not added.",
    removeFailed: "Couldn't remove the person.",
    removeOffline: "Couldn't reach the server. The person was not removed.",
  },
};

export const team = { tr, en };
