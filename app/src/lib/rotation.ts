export type Rotacion = 'alta' | 'media' | 'baja' | 'sin_rotacion';

export interface RotacionInfo {
  nivel: Rotacion;
  label: string;
  color: string;
  bg: string;
}

export const ROTACION_INFO: Record<Rotacion, RotacionInfo> = {
  alta: { nivel: 'alta', label: 'Alta rotación', color: 'text-neon-green', bg: 'bg-neon-green/10 border-neon-green/40' },
  media: { nivel: 'media', label: 'Media rotación', color: 'text-neon-cyan', bg: 'bg-neon-cyan/10 border-neon-cyan/40' },
  baja: { nivel: 'baja', label: 'Baja rotación', color: 'text-neon-yellow', bg: 'bg-neon-yellow/10 border-neon-yellow/40' },
  sin_rotacion: { nivel: 'sin_rotacion', label: 'Sin rotación', color: 'text-neon-red', bg: 'bg-neon-red/10 border-neon-red/40' },
};

/**
 * Clasifica la rotación de un producto según sus ventas de los últimos 30 días.
 * Devuelve la info de estilo según cuartiles de unidades vendidas.
 */
export function clasificarRotacion(
  unidadesVendidas: number,
  cuartiles: { q1: number; q2: number; q3: number }
): RotacionInfo {
  if (unidadesVendidas <= 0) return ROTACION_INFO.sin_rotacion;
  if (unidadesVendidas >= cuartiles.q3) return ROTACION_INFO.alta;
  if (unidadesVendidas >= cuartiles.q2) return ROTACION_INFO.media;
  if (unidadesVendidas >= cuartiles.q1) return ROTACION_INFO.baja;
  return ROTACION_INFO.sin_rotacion;
}

/**
 * Calcula cuartiles de un array de números.
 */
export function calcularCuartiles(valores: number[]): { q1: number; q2: number; q3: number } {
  if (valores.length === 0) return { q1: 0, q2: 0, q3: 0 };
  const sorted = [...valores].sort((a, b) => a - b);
  const q = (p: number) => {
    const pos = (sorted.length - 1) * p;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    }
    return sorted[base];
  };
  return { q1: q(0.25), q2: q(0.5), q3: q(0.75) };
}
