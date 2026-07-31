import { db } from './db';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'status'
  | 'assign'
  | 'claim'
  | 'comment'
  | 'label'
  | 'create'
  | 'delete'
  | 'user_add'
  | 'user_remove';

export type AuditEntry = {
  actor: string;
  action: AuditAction;
  taskId?: number | null;
  taskCode?: string | null;
  from?: string | null;
  to?: string | null;
  note?: string | null;
};

/**
 * Tek audit yazma noktası. Her mutasyon route'u bunu çağırır —
 * böylece log'lanmayan bir aksiyon kalmaz.
 */
export async function logActivity(entry: AuditEntry): Promise<void> {
  const sql = db();
  await sql`
    INSERT INTO activity_log (actor, action, task_id, task_code, from_value, to_value, note)
    VALUES (
      ${entry.actor},
      ${entry.action},
      ${entry.taskId ?? null},
      ${entry.taskCode ?? null},
      ${entry.from ?? null},
      ${entry.to ?? null},
      ${entry.note ?? null}
    )
  `;
}

/** İnsan okunur aksiyon etiketleri — /aktivite ekranı bunları gösterir. */
export const ACTION_LABELS: Record<AuditAction, string> = {
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
};
