'use client';

// Durum metni sözlükten, rengi STATUS_STYLES'tan gelir. Metni prop olarak almak
// yerine 'use client' + useDict() seçildi: metin tamamen `status` propundan
// türüyor, çağıranın taşıyacağı bir bilgi yok. Böylece props imzası da olduğu
// gibi kalıyor ve bileşeni kullanan başka ekranlar etkilenmiyor.

import { STATUS_STYLES, type Status } from '@/lib/types';
import { useDict } from '@/lib/i18n/provider';

export default function StatusBadge({
  status,
  className = '',
}: {
  status: Status;
  className?: string;
}) {
  const t = useDict();
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${style.chip} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {t.common.status[status]}
    </span>
  );
}
