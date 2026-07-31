import { STATUS_STYLES, type Status } from '@/lib/types';

export default function StatusBadge({
  status,
  className = '',
}: {
  status: Status;
  className?: string;
}) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${style.chip} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {style.label}
    </span>
  );
}
