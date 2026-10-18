# MiMatrícula

Matrícula inteligente con recomendación de docentes basada en reseñas estudiantiles.
Proyecto académico (UTP). Este repositorio es un **monorepo**: todas las partes del sistema viven aquí y comparten un mismo contrato de datos.

## Requisitos

- Node.js 20 o superior
- pnpm 10 (`corepack enable` lo activa sin instalar nada más)

## Cómo correrlo

```bash
pnpm install
pnpm dev          # levanta la web (5173) y el portal ficticio (5174) a la vez
```

- **MiMatrícula (web):** http://localhost:5173. Ingresa con cualquier nombre y un correo `@utp.edu.pe`. Para cerrar sesión, haz clic en tu avatar.
- **Portal de matrícula ficticio:** http://localhost:5174

Otros comandos:

```bash
pnpm dev:web       # solo la web
pnpm dev:portal    # solo el portal ficticio
pnpm test          # pruebas (Vitest)
pnpm typecheck     # revisión de tipos
pnpm build         # compila todo
pnpm gen:data      # regenera cursos, secciones y reseñas de demo
```

## Estructura

```
apps/
  web/          MiMatrícula: la app del estudiante (React + Tailwind)
  portal-mock/  Portal de matrícula ficticio que imita al de la universidad
  extension/    (fase 2) extensión del navegador que lee el portal
  api/          (fase 4) API Fastify + Prisma + PostgreSQL
packages/
  shared/       Tipos y esquemas Zod: el contrato entre todas las apps
  demo-data/    Oferta y reseñas de simulación (generadas con semilla fija)
  scheduler/    (fase 5) generador de horarios
```

### Contrato de datos (`packages/shared`)

Todas las apps usan los mismos tipos: `Course`, `Section` (con varias `sessions` y horas con minutos), `Professor`, `Review`, `EnrollmentOffer`, `CatalogImport` (lo que envía la extensión), `StudentPreferences` (el asistente de matrícula) y `Student`.
**Si cambias un esquema, cambia a la vez las apps que lo usan y avísalo en el PR.**

### Portal ficticio (`apps/portal-mock`)

- Carga la oferta desde `/api/oferta.json`, como haría el portal real con su API interna.
- Pantallas: "Cursos a matricular", el modal "Secciones disponibles" con las pestañas Mañana/Noche y el docente, "Resumen", "Completar matrícula" y "Mi horario".
- Avisa los cruces de horario y las secciones sin vacantes. Guarda la selección en el navegador.
- Cada fila tiene atributos `data-mm="course"` y `data-mm="section"` con sus datos, para que la extensión los pueda leer.

### Datos de demo (`packages/demo-data`)

12 cursos, 102 secciones, 25 docentes ficticios y 144 reseñas. Todas las reseñas tienen `demo: true` para poder borrarlas fácilmente.
`pnpm gen:data` las regenera de forma determinista (siempre salen los mismos datos).

## Estado

| Fase | Qué | Estado |
|---|---|---|
| 0 | Monorepo + contrato de datos | ✅ |
| 1 | Portal de matrícula ficticio | ✅ |
| – | Login de demo `@utp.edu.pe` en la web | ✅ |
| 2 | Extensión que extrae la oferta y la envía | ⏳ |
| 3 | Web migrada: rutas, Tailwind, tema UTP, responsive, datos reales | ⏳ |
| 4 | API + base de datos + reseñas persistentes | ⏳ |
| 5 | Asistente de preferencias + generador inteligente | ⏳ |
| 6 | Análisis de sentimiento de reseñas | ⏳ |

> El login solo valida el **formato** del correo. No hay contraseña ni verificación real.
