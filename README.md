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

> En Windows, si `corepack enable` da error de permisos, usa `npx pnpm@10 install` y `npx pnpm@10 dev`.

- **MiMatrícula (web):** http://localhost:5173. Ingresa con cualquier nombre y un correo `@utp.edu.pe`. Para cerrar sesión, haz clic en tu avatar.
- **Portal de matrícula ficticio:** http://localhost:5174

### Instalar la extensión (Chrome o Edge)

1. `pnpm build:ext`. Esto genera la carpeta `apps/extension/.output/chrome-mv3`.
2. Abre `chrome://extensions` (o `edge://extensions`) y activa el **Modo de desarrollador**.
3. Haz clic en **Cargar descomprimida** y elige la carpeta `chrome-mv3`.
4. Fija la extensión (ícono de pieza de rompecabezas → 📌).

**Probar el flujo completo:**

1. Con `pnpm dev` corriendo, entra a MiMatrícula (http://localhost:5173) e inicia sesión.
2. En otra pestaña abre el portal (http://localhost:5174).
3. Con el portal al frente, haz clic en la extensión → **Extraer oferta** → **Enviar a MiMatrícula**.
4. La extensión vuelve a MiMatrícula, aparece el aviso verde "Oferta importada" y la sección **Cursos** muestra la oferta.

Sin extensión también puedes probar: en MiMatrícula pulsa **Usar datos de demo**.

Si cambias el código de la extensión, vuelve a correr `pnpm build:ext` y presiona ↻ en la tarjeta de la extensión en `chrome://extensions`.

Otros comandos:

```bash
pnpm dev:web       # solo la web
pnpm dev:portal    # solo el portal ficticio
pnpm build:ext     # compila la extensión en apps/extension/.output/chrome-mv3
pnpm dev:ext       # extensión con recarga automática (abre un Chrome de pruebas)
pnpm test          # pruebas (Vitest)
pnpm typecheck     # revisión de tipos
pnpm build         # compila todo
pnpm gen:data      # regenera cursos, secciones y reseñas de demo
```

## Estructura

```
apps/
  web/          MiMatrícula: la app del estudiante (React + Tailwind + react-router + Zustand)
  portal-mock/  Portal de matrícula ficticio que imita al de la universidad
  extension/    Extensión del navegador (WXT, Manifest V3) que lee el portal y envía la oferta
  api/          (fase 4) API Fastify + Prisma + PostgreSQL
packages/
  shared/       Tipos y esquemas Zod: el contrato entre todas las apps
  demo-data/    Oferta y reseñas de simulación (generadas con semilla fija)
  scheduler/    Generador de horarios (búsqueda con poda + mejora local)
```

### Contrato de datos (`packages/shared`)

Todas las apps usan los mismos tipos: `Course`, `Section` (con varias `sessions` y horas con minutos), `Professor`, `Review`, `EnrollmentOffer`, `CatalogImport` (lo que envía la extensión), `StudentPreferences` (el asistente de matrícula) y `Student`.
**Si cambias un esquema, cambia a la vez las apps que lo usan y avísalo en el PR.**

### Portal ficticio (`apps/portal-mock`)

- Carga la oferta desde `/api/oferta.json`, como haría el portal real con su API interna.
- Pantallas: "Cursos a matricular", el modal "Secciones disponibles" con las pestañas Mañana/Noche y el docente, "Resumen", "Completar matrícula" y "Mi horario".
- Avisa los cruces de horario y las secciones sin vacantes. Guarda la selección en el navegador.
- Cada fila tiene atributos `data-mm="course"` y `data-mm="section"` con sus datos, para que la extensión los pueda leer.

### MiMatrícula (`apps/web`)

| Ruta | Qué hace |
|---|---|
| `/` | Inicio: resumen, docentes mejor evaluados, pasos |
| `/cursos` | Oferta por curso: secciones con docente, nota, vacantes y aviso de cruce; filtro por turno |
| `/horario` | Grilla semanal con horas reales y lista de cursos elegidos |
| `/profesores` y `/profesores/:id` | Ranking, detalle por criterio, reseñas y formulario para escribir una |
| `/recomendaciones` | Mejores secciones por curso y "Aplicar recomendación" (sin cruces, hasta 22 créditos) |
| `/generador` | Asistente de 4 pasos (turno, trabajo, límites, resumen) y las 3 mejores opciones de horario |

- Estado en `src/store/` (Zustand, guardado en el navegador): oferta, horario elegido y reseñas propias.
- La nota de cada docente se calcula en `packages/shared/src/ratings.ts` con un promedio bayesiano: con pocas reseñas se acerca al promedio general.

### Generador (`packages/scheduler`)

- `generate()` recibe la oferta, las notas de los docentes y las preferencias del asistente, y devuelve las 3 mejores combinaciones distintas.
- Filtros duros: vacantes, turnos elegidos, días libres, horas de trabajo (con el margen para llegar), máximo de cursos, 22 créditos y presupuesto (créditos × precio por crédito).
- Orden de prioridad: cursos repetidos, más cursos, obligatorios antes que electivos y, al final, un puntaje que mezcla la nota de los docentes con la comodidad (menos días y menos horas muertas) según lo que elija el estudiante.
- Busca una vez por cada combinación de días de clase y poda las ramas que no pueden ganar; después prueba cambiar secciones sueltas. Si un curso no entra, explica por qué y sugiere qué preferencia aflojar.
- En la web corre en un Web Worker (`src/generator/`) para no congelar la página.

### Extensión (`apps/extension`)

- `portal.content.ts` corre en el portal. **Solo lee:** pide la oferta a la misma API que usa el portal, la cruza con la tabla visible y la valida con Zod. Nunca hace clic ni envía formularios.
- `background.ts` busca o abre la pestaña de MiMatrícula y le entrega los datos. Va en el background porque el popup se cierra al cambiar de pestaña.
- `mimatricula.content.ts` corre en la web y pasa los datos a la página con `window.postMessage`. La web los vuelve a validar antes de guardarlos.
- Para apuntar al portal real o a la web desplegada, cambia los `matches` de los content scripts y los `host_permissions` en `wxt.config.ts`, y escribe un nuevo adaptador en `lib/extract.ts`.

### Datos de demo (`packages/demo-data`)

12 cursos, 102 secciones, 25 docentes ficticios y 144 reseñas. Todas las reseñas tienen `demo: true` para poder borrarlas fácilmente.
`pnpm gen:data` las regenera de forma determinista (siempre salen los mismos datos).

## Estado

| Fase | Qué | Estado |
|---|---|---|
| 0 | Monorepo + contrato de datos | ✅ |
| 1 | Portal de matrícula ficticio | ✅ |
| – | Login de demo `@utp.edu.pe` en la web | ✅ |
| 2 | Extensión que extrae la oferta y la envía | ✅ |
| 3 | Web migrada: rutas, Tailwind, tema UTP, responsive, datos reales | ✅ |
| 4 | API + base de datos + reseñas persistentes | ⏳ |
| 5 | Asistente de preferencias + generador inteligente | ✅ |
| 6 | Análisis de sentimiento de reseñas | ⏳ |

> El login solo valida el **formato** del correo. No hay contraseña ni verificación real.
