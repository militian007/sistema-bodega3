export const fmtUSD = (n: number | null | undefined): string => {
  if (n == null || isNaN(n)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
};

export const fmtBs = (n: number | null | undefined): string => {
  if (n == null || isNaN(n)) return 'Bs 0,00';
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
};

export const fmtNumber = (n: number | null | undefined, dec = 2): string => {
  if (n == null || isNaN(n)) return '0';
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  }).format(n);
};

export const fmtDate = (s: string | null | undefined): string => {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString('es-VE', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

export const fmtDateTime = (s: string | null | undefined): string => {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleString('es-VE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const todayISO = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const nowTime = (): string => {
  return new Date().toTimeString().split(' ')[0].slice(0, 8);
};

export const FORMA_PAGO_LABEL: Record<string, string> = {
  efectivo_usd: 'Efectivo USD$',
  efectivo_bs: 'Efectivo Bs',
  pago_movil: 'Pago Móvil',
  zelle: 'Zelle',
  transferencia: 'Transferencia',
  mixto: 'Mixto',
  credito: 'A crédito',
};
