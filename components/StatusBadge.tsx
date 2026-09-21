import type { StatusInfo } from '@/lib/format';

export function StatusBadge({ info }: { info: StatusInfo }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${info.className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {info.label}
    </span>
  );
}