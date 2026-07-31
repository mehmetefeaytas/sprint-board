// Veritabanı şemasının TEK kaynağı. POST /api/seed bunu çalıştırır.
//
// .sql dosyası olarak değil TypeScript metni olarak tutuluyor: Vercel'de
// çalışma anında dosya okumak güvenilir değil, gömülü metin her zaman paketle
// birlikte gider. Böylece "şema iki yerde, biri güncellenmemiş" hatası olamaz.
//
// Tüm CREATE'ler IF NOT EXISTS — tohumlama birden fazla kez çağrılabilir.

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  email      TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  track      TEXT NOT NULL,
  is_admin   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sprint_days (
  day_no    INT PRIMARY KEY,
  date      DATE NOT NULL,
  weekday   TEXT NOT NULL,
  theme     TEXT NOT NULL,
  milestone TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
  id           SERIAL PRIMARY KEY,
  code         TEXT NOT NULL UNIQUE,
  day_no       INT NOT NULL REFERENCES sprint_days (day_no),
  track        TEXT NOT NULL,
  origin_track TEXT,
  title        TEXT NOT NULL,
  detail       TEXT,
  output       TEXT,
  status       TEXT NOT NULL DEFAULT 'todo',
  assignee     TEXT REFERENCES users (email) ON DELETE SET NULL,
  is_blocker   BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order   INT NOT NULL DEFAULT 0,
  created_by   TEXT REFERENCES users (email) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  completed_by TEXT
);

CREATE TABLE IF NOT EXISTS task_labels (
  task_id INT NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
  label   TEXT NOT NULL,
  PRIMARY KEY (task_id, label)
);

CREATE TABLE IF NOT EXISTS comments (
  id         SERIAL PRIMARY KEY,
  task_id    INT NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
  author     TEXT NOT NULL REFERENCES users (email) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mentions (
  id         SERIAL PRIMARY KEY,
  comment_id INT REFERENCES comments (id) ON DELETE CASCADE,
  task_id    INT REFERENCES tasks (id) ON DELETE CASCADE,
  mentioned  TEXT NOT NULL REFERENCES users (email) ON DELETE CASCADE,
  seen       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- "Kim ne yaptı" — tek audit yazma noktası lib/audit.ts.
-- action: login | status | assign | claim | comment | label | create | delete
--         | user_add | user_remove
CREATE TABLE IF NOT EXISTS activity_log (
  id         BIGSERIAL PRIMARY KEY,
  actor      TEXT NOT NULL,
  action     TEXT NOT NULL,
  task_id    INT,
  task_code  TEXT,
  from_value TEXT,
  to_value   TEXT,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_day        ON tasks (day_no, sort_order);
CREATE INDEX IF NOT EXISTS idx_comments_task    ON comments (task_id, created_at);
CREATE INDEX IF NOT EXISTS idx_mentions_user    ON mentions (mentioned, seen);
`;

/** Neon HTTP sürücüsü tek çağrıda tek statement kabul eder; şemayı bölüyoruz. */
export function schemaStatements(): string[] {
  return SCHEMA_SQL.split(';')
    .map((statement) => statement.trim())
    // Yalnızca yorum satırlarından oluşan parçalar çalıştırılmaz.
    .filter((statement) => statement !== '' && !/^(--[^\n]*\n?)+$/.test(statement));
}
