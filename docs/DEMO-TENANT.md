# Tenant de Demo — Primaria

Tenant de prueba con datos realistas para desarrollo y QA.

| Campo       | Valor                          |
|-------------|--------------------------------|
| Slug        | `demo_primaria`                |
| Nombre      | I.E. 00001 San José - Demo     |
| Nivel       | Primaria (1° a 6°)             |
| Régimen     | Bimestral (4 bimestres)        |
| Año escolar | 2026 (01/03 – 15/12)           |
| Plan        | Profesional                    |

---

## Comandos

### Crear el demo (primera vez)
```bash
npm run demo:seed
```
Crea el tenant completo: schema, grados, secciones, docentes, 30 estudiantes matriculados.

### Resetear (borrar y volver a crear)
```bash
npm run demo:reset
```
Útil para volver a un estado limpio durante el desarrollo.

### Eliminar
```bash
npm run demo:drop
```
Borra el schema PostgreSQL y todos los registros del tenant en el schema público.

---

## Credenciales

Contraseña única para todos los usuarios: **`Demo2026!`**

| Email                  | Rol           | Sección |
|------------------------|---------------|---------|
| director@demo.sige     | Director      | —       |
| docente1@demo.sige     | Docente Tutor | 1° A    |
| docente2@demo.sige     | Docente Tutor | 2° A    |
| docente3@demo.sige     | Docente Tutor | 3° A    |
| docente4@demo.sige     | Docente Tutor | 4° A    |
| docente5@demo.sige     | Docente Tutor | 5° A    |
| docente6@demo.sige     | Docente Tutor | 6° A    |

---

## Datos incluidos

- **6 grados** (Primer a Sexto Grado) con 1 sección "A" cada uno
- **30 estudiantes** matriculados (5 por grado) con DNI, fecha de nacimiento y género
- **Áreas curriculares** de Primaria según CNEB (Comunicación, Matemática, Personal Social, etc.)
- **6 períodos**: B1, B2, B3, B4, Recuperación, Anual
- **Datos MINEDU**: DRE San Martín / UGEL Mariscal Cáceres

---

## Notas

- El demo requiere que el seeder principal (`npm run db:seed`) ya haya sido ejecutado, ya que depende de `public.areas_cneb` y `public.competencias_cneb`.
- Los DNIs de los estudiantes son ficticios (`11000001` – `11000030`).
- Para ingresar al sistema web usa el slug `demo_primaria` en la URL o en el campo de tenant.
- Si el tenant ya existe, `demo:seed` falla con un error. Usa `demo:reset` en ese caso.
