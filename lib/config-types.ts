// sprint.config.ts'in sözleşmesi. Yalnızca tip tanımı içerir; çalışma zamanı
// doğrulaması lib/config.ts içindedir.

/** Track rengi. Tailwind sınıfları statik üretilmek zorunda olduğu için
 *  serbest metin değil, sabit bir palet. Karşılıkları lib/config.ts'te. */
export type TrackColor =
  | 'indigo'
  | 'teal'
  | 'sky'
  | 'rose'
  | 'amber'
  | 'violet'
  | 'emerald'
  | 'slate';

export type Status = 'todo' | 'in_progress' | 'blocked' | 'done';

/** Track anahtarı serbest metindir; geçerli değerler sprint.config.ts'ten gelir. */
export type Track = string;

export type TrackDef = {
  /** Veritabanına yazılan anahtar. Yalnızca A-Z, 0-9 ve alt çizgi. */
  key: string;
  /** Arayüzde görünen ad. */
  label: string;
  /** Görev kodlarında kullanılan kısaltma (G1-DEV-01). Track'ler arasında tekil. */
  abbr: string;
  color: TrackColor;
};

export type UserDef = {
  /** Küçük harfe çevrilir. Giriş bu listeye göre yapılır: listede yoksa giriş yok. */
  email: string;
  name: string;
  /** tracks içindeki bir key. */
  track: string;
  /** true ise girişte ADMIN_PASSWORD sorulur ve silme/kişi yönetimi yetkisi açılır. */
  is_admin?: boolean;
};

export type DayDef = {
  /** Pozitif tam sayı, tekil. Gün sekmeleri bu sıraya göre dizilir. */
  day_no: number;
  /** YYYY-MM-DD. */
  date: string;
  /** Gün adı. Boş bırakılırsa tarihten ve aktif dilden türetilir — iki dilli
   *  kullanımda bunu boş bırakmak daha iyidir. */
  weekday?: string;
  /** Günün teması — sekme başlığının altında görünür. */
  theme: string;
  /** Doldurulursa o gün milestone olarak işaretlenir. */
  milestone?: string | null;
};

export type TaskDef = {
  /** Görevin kalıcı kimliği ve URL'i (/task/G1-DEV-01). Tohumlandıktan sonra değiştirme. */
  code: string;
  /** days içindeki bir day_no. */
  day_no: number;
  /** tracks içindeki bir key — görevin şu anki sahibi. */
  track: string;
  /** Devralınan işlerde işin geldiği track. Panoda "devralınabilir" olarak gösterilir. */
  origin_track?: string;
  title: string;
  detail?: string;
  /** Görevin somut çıktısı — "bitti" tanımını netleştirir. */
  output?: string;
  /** Belirtilmezse 'todo'. */
  status?: Status;
  /** users içindeki bir e-posta. Boş bırakılırsa görev sahipsiz açılır. */
  assignee?: string;
  /** true ise panoda kırmızı bloker olarak öne çıkar. */
  is_blocker?: boolean;
  /** Küçük harfe çevrilir. */
  labels?: string[];
};

export type SprintConfig = {
  /** Sekme başlığı ve üst navigasyonda görünür. */
  projectName: string;
  description?: string;
  /** IANA saat dilimi. Belirtilmezse 'Europe/Istanbul'. Tarihler ve saatler
   *  bu dilimde gösterilir; sunucu/istemci uyumu için sabittir. */
  timezone?: string;
  /** Arayüzün açılış dili: 'tr' veya 'en'. Belirtilmezse 'en'. Kullanıcı
   *  sağ üstteki düğmeyle değiştirebilir; seçim çerezde saklanır. */
  defaultLocale?: 'tr' | 'en';
  tracks: TrackDef[];
  users: UserDef[];
  days: DayDef[];
  tasks: TaskDef[];
};
