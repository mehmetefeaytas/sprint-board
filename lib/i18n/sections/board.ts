// Pano ekranı: gün şeridi, track blokları, görev kartı, özet şeridi, yeni görev
// formu. Kullanıcı içeriği (görev başlığı, track adı, gün teması, etiketler)
// burada yer almaz — o metinler sprint.config.ts'ten geldiği gibi gösterilir.
//
// Kalıp: tr yazılır, tip ondan türetilir, en o tipe uymak zorundadır.

const tr = {
  // Görünüm anahtarı ve üst çubuk
  viewSwitcher: 'Görünüm',
  calendarView: 'Takvim',
  boardView: 'Pano',
  newTask: '+ Yeni görev',
  newTaskTitle: 'Yeni görev',

  // Gün şeridi ve track blokları
  day: (dayNo: number) => `Gün ${dayNo}`,
  emptyDay: 'Bu günde görev yok. Üstteki “+ Yeni görev” ile ekleyebilirsiniz.',
  trackDone: (done: number, total: number) => `${done}/${total} tamam`,
  emptyColumn: 'Bu kolonda görev yok.',

  // Devralınabilir işler
  handoverHeading: '🤝 Devralınabilir işler',
  handoverIntro:
    "Geldikleri track'in kapasitesi dolduğu için bu işler devralınmayı bekliyor; başka bir track'ten biri üstlenebilir.",
  handoverEmpty: 'Şu anda devralınmayı bekleyen iş yok.',
  handoverMine: 'Bu işi devraldınız.',
  handoverBy: (name: string) => `${name} devraldı.`,
  claim: 'Bu işi devral',
  claiming: 'Devralınıyor…',

  // Görev kartı
  openTask: (code: string) => `${code} görev detayı`,
  checkDone: 'Tamamlandı olarak işaretle',
  uncheckDone: 'Tamamlandı işaretini kaldır',
  takeoverBadge: (trackLabel: string) => `🤝 Devralınabilir · ${trackLabel} track'inden`,

  // Özet şeridi
  sprintProgress: 'Sprint ilerlemesi',
  tasksDone: (done: number, total: number) => `${done} / ${total} görev tamamlandı`,
  todayIs: (date: string) => `Bugün ${date}`,
  blockedUnassigned: (blocked: number, unassigned: number) =>
    `${blocked} bloke/bloker · ${unassigned} atanmamış`,
  demoUnset: 'Demo tarihi tanımlı değil',
  demoToday: 'Demo bugün 🎯',
  demoPast: 'Demo tarihi geçti',
  demoIn: (days: number) => `Demoya ${days} iş günü`,

  // Hatalar
  saveFailed: 'Değişiklik kaydedilemedi.',
  dismissError: 'Uyarıyı kapat',

  // Yeni görev formu
  form: {
    day: 'Gün',
    track: 'Track',
    title: 'Başlık',
    titlePlaceholder: 'Kısa ve net bir başlık',
    detail: 'Açıklama (isteğe bağlı)',
    assignee: 'Atanan (isteğe bağlı)',
    labels: 'Etiketler (virgülle)',
    labelsPlaceholder: 'demo, sql',
    hint: (todoLabel: string) =>
      `Yeni görev “${todoLabel}” durumunda başlar. Görev kodu otomatik verilir.`,
    submit: 'Görevi oluştur',
    discard: 'Vazgeç',
    titleRequired: 'Başlık zorunlu.',
    createFailed: 'Görev oluşturulamadı.',
    networkError: 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.',
  },
};

export type BoardDict = typeof tr;

const en: BoardDict = {
  viewSwitcher: 'View',
  calendarView: 'Calendar',
  boardView: 'Board',
  newTask: '+ New task',
  newTaskTitle: 'New task',

  day: (dayNo: number) => `Day ${dayNo}`,
  emptyDay: 'No tasks for this day. Add one with “+ New task” above.',
  trackDone: (done: number, total: number) => `${done}/${total} done`,
  emptyColumn: 'No tasks in this column.',

  handoverHeading: '🤝 Up for grabs',
  handoverIntro:
    'These tasks are waiting to be picked up because their original track is at capacity; anyone from another track can take them on.',
  handoverEmpty: 'Nothing is waiting to be picked up right now.',
  handoverMine: 'You took this one on.',
  handoverBy: (name: string) => `${name} took this on.`,
  claim: 'Take this on',
  claiming: 'Taking on…',

  openTask: (code: string) => `${code} task details`,
  checkDone: 'Mark as done',
  uncheckDone: 'Unmark as done',
  takeoverBadge: (trackLabel: string) => `🤝 Up for grabs · from the ${trackLabel} track`,

  sprintProgress: 'Sprint progress',
  tasksDone: (done: number, total: number) => `${done} / ${total} tasks done`,
  todayIs: (date: string) => `Today, ${date}`,
  blockedUnassigned: (blocked: number, unassigned: number) =>
    `${blocked} blocked · ${unassigned} unassigned`,
  demoUnset: 'No demo date set',
  demoToday: 'Demo is today 🎯',
  demoPast: 'The demo date has passed',
  demoIn: (days: number) =>
    days === 1 ? '1 business day to demo' : `${days} business days to demo`,

  saveFailed: "Couldn't save the change.",
  dismissError: 'Dismiss alert',

  form: {
    day: 'Day',
    track: 'Track',
    title: 'Title',
    titlePlaceholder: 'A short, clear title',
    detail: 'Description (optional)',
    assignee: 'Assignee (optional)',
    labels: 'Labels (comma-separated)',
    labelsPlaceholder: 'demo, sql',
    hint: (todoLabel: string) =>
      `New tasks start in “${todoLabel}”. The task code is assigned automatically.`,
    submit: 'Create task',
    discard: 'Discard',
    titleRequired: 'A title is required.',
    createFailed: "Couldn't create the task.",
    networkError: "Couldn't reach the server. Check your connection and try again.",
  },
};

export const board = { tr, en };
