// Görev detayı ve yorumlar. Görev başlığı, açıklaması, etiketleri ve yorum
// gövdesi kullanıcı içeriğidir — sözlüğe girmez, olduğu gibi gösterilir.
//
// Kalıp: tr yazılır, tip ondan türetilir, en o tipe uymak zorundadır.

const tr = {
  backToBoard: 'Panoya dön',
  /** Gün rozeti: "Gün 3" — gün adı ve tarih format.ts'ten eklenir. */
  dayLabel: (dayNo: number) => `Gün ${dayNo}`,
  /** Devralınabilir iş bildirimi; track adı kullanıcı içeriği, çevrilmez. */
  inheritedFrom: (trackLabel: string) => `🤝 Devralınabilir iş · ${trackLabel} track'inden geldi.`,
  detailHeading: 'Açıklama',
  outputHeading: 'Beklenen çıktı',

  statusHeading: 'Durum',
  assignHeading: 'Atama',
  clearAssignee: 'Atamayı kaldır',
  assignToMe: 'Bana ata',

  labelsHeading: 'Etiketler',
  noLabels: 'Etiket yok.',
  newLabelPlaceholder: 'Yeni etiket',
  removeLabelAria: (label: string) => `${label} etiketini kaldır`,

  commentsHeading: (count: number) => `Yorumlar (${count})`,
  commentsEmpty: 'Henüz yorum yok. İlk notu siz yazın.',
  commentFieldLabel: 'Yeni yorum — birini etiketlemek için @ yazın',
  mentionSuggestions: 'Etiketlenebilecek kişiler',
  sending: 'Gönderiliyor…',
  addComment: 'Yorum ekle',

  historyHeading: 'Bu görevin geçmişi',
  historyEmpty: 'Bu görev için henüz kayıt yok.',

  adminHeading: 'Yönetici işlemi',
  deleteWarning: 'Silinen görev geri getirilemez; yorumları ve etiketleri de silinir.',
  deleteTask: 'Görevi sil',
  confirmDelete: (code: string) =>
    `${code} görevini kalıcı olarak silmek istediğinize emin misiniz?`,

  error: {
    saveFailed: 'Değişiklik kaydedilemedi.',
    saveOffline: 'Sunucuya ulaşılamadı. Değişiklik kaydedilemedi.',
    labelFailed: 'Etiket güncellenemedi.',
    labelOffline: 'Sunucuya ulaşılamadı. Etiket güncellenemedi.',
    deleteFailed: 'Görev silinemedi.',
    deleteOffline: 'Sunucuya ulaşılamadı. Görev silinemedi.',
    commentFailed: 'Yorum gönderilemedi.',
    commentOffline: 'Sunucuya ulaşılamadı. Yorum gönderilemedi.',
  },
};

export type TaskDict = typeof tr;

const en: TaskDict = {
  backToBoard: 'Back to board',
  dayLabel: (dayNo: number) => `Day ${dayNo}`,
  inheritedFrom: (trackLabel: string) => `🤝 Up for grabs · came from the ${trackLabel} track.`,
  detailHeading: 'Description',
  outputHeading: 'Expected output',

  statusHeading: 'Status',
  assignHeading: 'Assignee',
  clearAssignee: 'Clear assignee',
  assignToMe: 'Assign to me',

  labelsHeading: 'Labels',
  noLabels: 'No labels yet.',
  newLabelPlaceholder: 'New label',
  removeLabelAria: (label: string) => `Remove label ${label}`,

  commentsHeading: (count: number) => `Comments (${count})`,
  commentsEmpty: 'No comments yet. Leave the first note.',
  commentFieldLabel: 'New comment — type @ to mention someone',
  mentionSuggestions: 'People you can mention',
  sending: 'Sending…',
  addComment: 'Add comment',

  historyHeading: 'History for this task',
  historyEmpty: 'Nothing recorded for this task yet.',

  adminHeading: 'Admin action',
  deleteWarning: 'Deleting a task is permanent; its comments and labels go with it.',
  deleteTask: 'Delete task',
  confirmDelete: (code: string) => `Permanently delete task ${code}?`,

  error: {
    saveFailed: "Couldn't save the change.",
    saveOffline: "Couldn't reach the server. The change was not saved.",
    labelFailed: "Couldn't update the label.",
    labelOffline: "Couldn't reach the server. The label was not updated.",
    deleteFailed: "Couldn't delete the task.",
    deleteOffline: "Couldn't reach the server. The task was not deleted.",
    commentFailed: "Couldn't post the comment.",
    commentOffline: "Couldn't reach the server. The comment was not posted.",
  },
};

export const task = { tr, en };
