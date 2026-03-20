export function formatDni(dni: string): string {
  return dni.replace(/\D/g, '').slice(0, 8);
}

export function formatCalificativo(calificativo: string | number | null): string {
  if (calificativo === null || calificativo === undefined) return '—';
  return String(calificativo);
}

export function calcularCodigoSiagie(dni: string): string {
  return '000000' + dni.replace(/\D/g, '');
}

export function formatFecha(fecha: string | Date): string {
  const d = new Date(fecha);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anio = d.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

export function literalANumerico(calificativo: string): number {
  const mapa: Record<string, number> = { AD: 4, A: 3, B: 2, C: 1 };
  return mapa[calificativo] ?? 0;
}

export function numericoALiteral(promedio: number): string {
  if (promedio >= 3.5) return 'AD';
  if (promedio >= 2.5) return 'A';
  if (promedio >= 1.5) return 'B';
  return 'C';
}

export function notaNumericaALiteral(nota: number): string {
  if (nota >= 18) return 'AD';
  if (nota >= 14) return 'A';
  if (nota >= 11) return 'B';
  return 'C';
}
