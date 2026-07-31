// API'nin döndürdüğü hata mesajları. Bunlar kullanıcıya gösterildiği için
// çevrilir; route handler'lar aktif dili çerezden okur (lib/i18n/server.ts).

const tr = {
  session: {
    missing: 'Oturum bulunamadı.',
    adminRequired: 'Bu işlem için yönetici yetkisi gerekli.',
  },
  request: {
    invalidBody: 'Geçersiz istek gövdesi.',
    invalidTaskId: 'Geçersiz görev numarası.',
    invalidDayNo: 'Geçersiz gün numarası.',
    invalidStatus: 'Geçersiz durum değeri.',
    invalidTrack: 'Geçersiz track.',
    invalidLocale: 'Geçersiz dil.',
    invalidDetail: 'Geçersiz açıklama.',
    invalidOutput: 'Geçersiz çıktı alanı.',
  },
  auth: {
    emailRequired: 'E-posta gerekli.',
    emailInvalid: 'Geçerli bir e-posta girin.',
    notOnTeam: 'Bu e-posta ekip listesinde yok.',
    wrongPassword: 'Şifre hatalı.',
    adminPasswordMissing: 'Yönetici şifresi sunucuda tanımlı değil.',
    loginFailed: 'Giriş yapılamadı.',
    userReadFailed: 'Kullanıcı bilgisi okunamadı.',
    userNotOnTeam: 'Kullanıcı ekip listesinde bulunamadı.',
  },
  task: {
    notFound: 'Görev bulunamadı.',
    titleRequired: 'Görev başlığı boş olamaz.',
    dayNotFound: 'Böyle bir sprint günü yok.',
    assigneeNotOnTeam: 'Atanan kişi ekip listesinde yok.',
    createFailed: 'Görev oluşturulamadı.',
    createdButUnreadable: 'Görev oluşturuldu ama okunamadı.',
    updateFailed: 'Görev güncellenemedi.',
    deleteFailed: 'Görev silinemedi.',
  },
  comment: {
    empty: 'Yorum boş olamaz.',
    saveFailed: 'Yorum kaydedilemedi.',
    savedButUnreadable: 'Yorum kaydedildi ama okunamadı.',
    readFailed: 'Yorumlar okunamadı.',
  },
  label: {
    empty: 'Etiket boş olamaz.',
    addFailed: 'Etiket eklenemedi.',
    removeFailed: 'Etiket kaldırılamadı.',
  },
  user: {
    nameRequired: 'İsim boş olamaz.',
    emailTaken: 'Bu e-posta zaten kayıtlı.',
    notFound: 'Kişi bulunamadı.',
    addFailed: 'Kişi eklenemedi.',
    removeFailed: 'Kişi çıkarılamadı.',
    protectedAdmin: 'Yapılandırmada tanımlı yönetici hesabı silinemez.',
    listReadFailed: 'Ekip listesi okunamadı.',
  },
  board: {
    readFailed: 'Board verisi okunamadı.',
  },
  activity: {
    readFailed: 'Aktivite kaydı okunamadı.',
  },
  seed: {
    badToken: 'Seed token geçersiz.',
    failed: 'Seed işlemi başarısız oldu.',
  },
};

export type ApiDict = typeof tr;

const en: ApiDict = {
  session: {
    missing: 'No active session.',
    adminRequired: 'This action requires admin rights.',
  },
  request: {
    invalidBody: 'Invalid request body.',
    invalidTaskId: 'Invalid task id.',
    invalidDayNo: 'Invalid day number.',
    invalidStatus: 'Invalid status value.',
    invalidTrack: 'Invalid track.',
    invalidLocale: 'Invalid language.',
    invalidDetail: 'Invalid description.',
    invalidOutput: 'Invalid output field.',
  },
  auth: {
    emailRequired: 'Email is required.',
    emailInvalid: 'Enter a valid email address.',
    notOnTeam: 'This email is not on the team list.',
    wrongPassword: 'Wrong password.',
    adminPasswordMissing: 'The admin password is not configured on the server.',
    loginFailed: "Couldn't sign you in.",
    userReadFailed: "Couldn't read the account.",
    userNotOnTeam: 'That account is not on the team list.',
  },
  task: {
    notFound: 'Task not found.',
    titleRequired: 'The task title cannot be empty.',
    dayNotFound: 'No such sprint day.',
    assigneeNotOnTeam: 'The assignee is not on the team list.',
    createFailed: "Couldn't create the task.",
    createdButUnreadable: "The task was created but couldn't be read back.",
    updateFailed: "Couldn't update the task.",
    deleteFailed: "Couldn't delete the task.",
  },
  comment: {
    empty: 'The comment cannot be empty.',
    saveFailed: "Couldn't save the comment.",
    savedButUnreadable: "The comment was saved but couldn't be read back.",
    readFailed: "Couldn't read the comments.",
  },
  label: {
    empty: 'The label cannot be empty.',
    addFailed: "Couldn't add the label.",
    removeFailed: "Couldn't remove the label.",
  },
  user: {
    nameRequired: 'The name cannot be empty.',
    emailTaken: 'That email is already registered.',
    notFound: 'Person not found.',
    addFailed: "Couldn't add the person.",
    removeFailed: "Couldn't remove the person.",
    protectedAdmin: 'An admin account defined in the configuration cannot be removed.',
    listReadFailed: "Couldn't read the team list.",
  },
  board: {
    readFailed: "Couldn't read the board data.",
  },
  activity: {
    readFailed: "Couldn't read the activity log.",
  },
  seed: {
    badToken: 'Invalid seed token.',
    failed: 'Seeding failed.',
  },
};

export const api = { tr, en };
