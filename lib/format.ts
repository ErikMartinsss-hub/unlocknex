export function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function dateBR(bigint: number | string | undefined | null): string {
  if (!bigint) return '—';
  const d = typeof bigint === 'number' ? new Date(bigint) : new Date(Number(bigint));
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function dateTimeBR(bigint: number | string | undefined | null): string {
  if (!bigint) return '—';
  const d = typeof bigint === 'number' ? new Date(bigint) : new Date(Number(bigint));
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export type StatusInfo = {
  label: string;
  className: string;
};

export function orderStatus(status: string): StatusInfo {
  switch (status) {
    case 'concluido':
      return { label: 'Concluído', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
    case 'processando':
      return { label: 'Processando', className: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' };
    case 'pendente':
      return { label: 'Pendente', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
    case 'cancelado':
      return { label: 'Cancelado', className: 'bg-red-500/15 text-red-400 border-red-500/30' };
    default:
      return { label: status, className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' };
  }
}

export function ticketStatus(status: string): StatusInfo {
  switch (status) {
    case 'aberto':
      return { label: 'Aberto', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
    case 'respondido':
      return { label: 'Respondido', className: 'bg-neon-500/15 text-neon-400 border-neon-500/30' };
    case 'fechado':
      return { label: 'Fechado', className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' };
    default:
      return { label: status, className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' };
  }
}

export function transactionType(type: string): StatusInfo {
  switch (type) {
    case 'deposit':
      return { label: 'Depósito', className: 'text-emerald-400' };
    case 'refund':
      return { label: 'Reembolso', className: 'text-neon-400' };
    case 'charge':
      return { label: 'Pagamento de pedido', className: 'text-zinc-400' };
    default:
      return { label: type, className: 'text-zinc-400' };
  }
}