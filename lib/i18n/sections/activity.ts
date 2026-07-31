// Aktivite akışı ve görev geçmişi.
//
// actionLabels, lib/audit.ts içindeki AuditAction değerlerinin insan okunur
// karşılığı. Etiketler orada değil burada duruyor: audit.ts sunucudaki yazma
// yolu, görünen metin ise arayüz diline bağlı.
//
// Kalıp: tr yazılır, tip ondan türetilir, en o tipe uymak zorundadır.

const tr = {
  filterPerson: 'Kişi',
  filterAction: 'Eylem',
  all: 'Tümü',
  emptyFiltered:
    'Bu filtreye uyan kayıt yok. Filtreleri “Tümü” yaparak tüm geçmişi görebilirsiniz.',
  actionLabels: {
    login: 'giriş yaptı',
    logout: 'çıkış yaptı',
    status: 'durumu değiştirdi',
    assign: 'atama yaptı',
    claim: 'işi devraldı',
    comment: 'yorum yazdı',
    label: 'etiket değiştirdi',
    create: 'görev oluşturdu',
    delete: 'görev sildi',
    user_add: 'ekibe kişi ekledi',
    user_remove: 'kişiyi ekipten çıkardı',
  },
};

export type ActivityDict = typeof tr;

const en: ActivityDict = {
  filterPerson: 'Person',
  filterAction: 'Action',
  all: 'All',
  emptyFiltered: 'Nothing matches this filter. Set both filters to “All” to see the whole history.',
  actionLabels: {
    login: 'signed in',
    logout: 'signed out',
    status: 'changed the status',
    assign: 'changed the assignee',
    claim: 'took over the task',
    comment: 'left a comment',
    label: 'changed a label',
    create: 'created a task',
    delete: 'deleted a task',
    user_add: 'added someone to the team',
    user_remove: 'removed someone from the team',
  },
};

export const activity = { tr, en };
