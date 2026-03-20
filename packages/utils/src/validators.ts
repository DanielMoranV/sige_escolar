export function esDniValido(dni: string): boolean {
  return /^\d{8}$/.test(dni.trim());
}

export function esUbigeoValido(ubigeo: string): boolean {
  return /^\d{6}$/.test(ubigeo.trim());
}

export function esCodigoModularValido(codigo: string): boolean {
  return /^\d{7}$/.test(codigo.trim());
}

export function esEmailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function generarSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 63);
}
