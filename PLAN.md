# PLAN: Plataforma de Menús Digitales Automatizada

> **Documento de implementación.** Self-contained, sin dependencias del proyecto viejo. Pensado para arrancar de cero con Claude en otra carpeta. Todas las decisiones están tomadas — no hay "lo vemos en el camino".
>
> Documentos relacionados (lectura recomendada pero no obligatoria):
> - [NUEVO-PROYECTO-BRIEF.md](NUEVO-PROYECTO-BRIEF.md) — análisis del proyecto viejo (referencia visual y de modelo de datos).
> - [n8n-workflow-viejo.json](n8n-workflow-viejo.json) — workflow n8n previo (referencia de qué evitar).

---

## 0. INSTRUCCIONES PARA EL ASISTENTE (leé esto primero)

> Esta sección es para vos, Claude, que vas a guiar al usuario en la implementación. El usuario te va a pasar este MD y esperar que lo lleves paso a paso. Leé estas reglas ANTES de hacer cualquier cosa.

### Modo de operación: hand-holding total

El usuario no es desarrollador full-time. Asumí:
- No conoce los menús de Vercel, GitHub, Cloudflare ni n8n por memoria.
- Va a alternar entre tu chat, el navegador, la terminal y editores. Eso cuesta.
- Si le tirás 5 pasos juntos, se va a perder en el 2do y va a venir frustrado.
- Si le decís "andá a Vercel y creá el proyecto" sin link, va a googlear y perder tiempo.

### Reglas estrictas para guiar

1. **Una acción por mensaje.** Nada de "hacé esto, después esto, después esto". Una sola acción, esperá confirmación, seguís.

2. **Siempre dale el link directo.** Nada de "andá a Vercel" — sí "abrí https://vercel.com/new/clone o entrá a https://vercel.com/dashboard y hacé click en 'Add New Project'".

3. **Comandos copy-pasteable, no descripciones.** Mal: "instalá Astro". Bien:
   ```bash
   cd /Users/xavier/Proyectos
   npm create astro@latest menudigital-platform -- --template minimal --typescript strict --no-install
   ```

4. **Pedí capturas cuando necesites verificar.** Después de cualquier paso visual (crear cuenta, configurar un servicio, llenar un formulario), pedile screenshot antes de avanzar. Ejemplos:
   - "Mandame captura de la pantalla de Vercel después de crear el proyecto, quiero verificar que el framework detectó Astro."
   - "Captura de las variables de entorno que cargaste, sin mostrar los valores."
   - "Mandame foto del nodo de n8n con la configuración que pusiste."

5. **Antes de cada captura, decile qué tiene que mostrar.** No solo "mandá captura" — "captura donde se vea el sidebar de Vercel con el nombre del proyecto, así confirmo que está bien conectado al repo correcto".

6. **Explicá brevemente el "por qué" de cada paso.** Una línea, no un párrafo. Ej: "Vamos a crear un PAT de GitHub porque n8n necesita permiso para escribir en el repo." Después la acción.

7. **Cuando el usuario tenga que elegir algo en una UI, describí qué tiene que ver.** Mal: "elegí el framework". Bien: "vas a ver un dropdown que dice 'Framework Preset'. Elegí 'Astro' de la lista".

8. **Si un paso puede fallar, anticipalo.** Ej: "Si te aparece un error de 'permission denied', es porque el PAT necesita el scope `repo`. Avisame y lo regeneramos."

9. **Persistí decisiones del usuario.** Cuando elija un nombre de repo, una región de Vercel, un email — anotalo y NO se lo vuelvas a preguntar después. Si tenés sistema de memoria, usalo.

10. **Errores: debug CON él, no AL él.** Si algo falla:
    - Pedile el mensaje de error completo (captura o pegado).
    - Explicale qué significa en lenguaje simple.
    - Proponé UNA solución concreta para probar.
    - Si no funciona, otra. No abrumes con 5 hipótesis.

11. **Marcá progreso visible.** Al cerrar cada fase, hacé un resumen tipo "✅ Fase 0 lista. Esto es lo que tenemos: repo en GitHub, deploy a Vercel funcionando, schema validado en CI. Próxima fase: …"

12. **No te adelantes a fases que no toca.** Si estamos en Fase 1, no menciones cosas de Fase 4 salvo que sea estrictamente necesario para no pintarse en un rincón.

13. **Recordale cuándo commitear.** El usuario puede olvidar. Después de cambios significativos: "Antes de seguir, hagamos commit. Comando: `git add . && git commit -m 'feat: ...'`. Después: `git push`."

14. **Cuando trabajes con APIs/secrets, recordá la higiene.** "Nunca pegues este token en el chat. Solo cargalo en la variable de entorno y confirmame con captura del nombre de la variable (no del valor)."

### Granularidad esperada

Para que tengas un parámetro: **Fase 0 (Setup) debería tomar ~15-25 mensajes tuyos**, no 3. Cada paso atómico es su propio mensaje. El usuario prefiere muchos mensajes cortos a pocos mensajes largos.

### Ejemplo de cómo debe verse un paso

❌ **Mal** (muy denso, sin link, sin verificación):
> Ahora creá un repo en GitHub, configurá Vercel, conectalos y agregá las variables de entorno del README.

✅ **Bien** (un solo paso, link directo, verificación):
> **Paso 3: crear el repo en GitHub.**
>
> Por qué: vamos a guardar el código y los menús ahí. Vercel va a desplegar desde este repo automáticamente.
>
> 1. Abrí https://github.com/new
> 2. Repository name: `menudigital-platform`
> 3. Description: `Plataforma de menús digitales automatizada`
> 4. Visibility: **Public** (los menús son indexables por Google, ayuda a los restaurantes)
> 5. NO tildes "Add a README" ni ".gitignore" ni "license" — vamos a crear eso desde el proyecto local.
> 6. Click en "Create repository".
>
> 📸 Mandame captura de la página que se muestra después de crear el repo (la que dice "Quick setup" con los comandos para empezar). Quiero verificar que el repo quedó como esperamos.

### Cuando el usuario diga "está hecho"

Pedí evidencia. No avances solo porque te dijo OK. Una captura, el output de un comando, o el link al deploy. Si insiste sin evidencia, está bien — pero dejá una nota: "OK, anotamos que diste por hecho X sin verificación. Si algo falla más adelante, vamos a empezar a debugear por acá."

---

## 1. Qué construimos (en 5 líneas)

1. Una **plataforma de menús digitales** para restaurantes de Córdoba/San Luis (Argentina).
2. El operador (vos) sube un PDF de menú al dashboard admin.
3. n8n + Gemini 2.0 Flash extraen los datos y los guardan como JSON en un repo de GitHub.
4. Cada restaurante tiene su URL pública con menú renderizado, paleta y tipografía propias (detectadas del PDF).
5. Si el restaurante firma, vos editás el JSON a mano en GitHub para ajustes finos.

---

## 2. Decisiones tomadas (consolidado)

### Producto
- **MVP funcional, no escalable**. Si renta, evolucionamos.
- **Operador único**: vos. Tus vendedores te pasan PDFs por WhatsApp; vos los procesás.
- **Volumen esperado**: 3-5 PDFs por semana.
- **Zona**: Argentina (es-AR, pesos argentinos, formato local).
- **Menús sin marca del operador**. Cada menú parece propiedad del restaurante.
- **Pre-venta = demo funcional, sin sello "DEMO"**.
- **Post-venta** = vos editás JSON a mano en GitHub para correcciones.
- **Frecuencia de cambios**: ~1 vez por mes por restaurante.
- **Si el restaurante rechaza**: el menú se "oculta" desde el admin (URL devuelve 404, JSON queda guardado).

### Técnico
- **Stack**: Astro 5 (híbrido SSR/SSG) + Vercel free tier + GitHub.
- **LLM**: Gemini 2.0 Flash via Google AI Studio (free tier).
- **n8n**: self-hosted (lo que ya corre en tu máquina), expuesto vía Cloudflare Tunnel (gratis).
- **Auth admin**: HTTP Basic Auth con un solo usuario en env vars.
- **Sin pago**: todo free tier hasta que la plataforma genere ingresos.
- **Sin imágenes en MVP**: solo texto + emoji por categoría. Imágenes en v2.
- **Sin editor visual en admin**: edición vía link a GitHub web editor.
- **Sin PR review**: commit directo a `main`. Vos sos el único editor.
- **Estructura UI fija para todos**: solo cambian colores, tipografía, datos, precios, descripciones.
- **Si la IA no encuentra un dato → marcador "_dato no disponible_"** + flag `_meta.missingFields[]` que el dashboard muestra como warning.

### Lo que NO entra en MVP (lista cerrada)
- Imágenes extraídas del PDF (logos, fotos de platos).
- Editor visual en el dashboard.
- Multi-usuario / multi-operador.
- Panel para el restaurante (que ellos editen).
- Suscripción de pago automática.
- Notificaciones por WhatsApp/email (vos ves el dashboard cuando querés).
- Analytics de visitas.
- QR generator.
- Custom domains por restaurante.
- Versionado/historial visible de cambios al menú (git ya lo guarda).

---

## 3. Stack y costos

| Componente | Servicio | Plan | Costo |
|---|---|---|---|
| Frontend + Dashboard | Astro deployado en Vercel | Hobby (free) | $0 |
| Repo | GitHub | Free | $0 |
| Workflow | n8n self-hosted (local) | — | $0 |
| Túnel público para n8n | Cloudflare Tunnel | Free | $0 |
| LLM | Gemini 2.0 Flash (Google AI Studio) | Free tier (~1500 req/día) | $0 |
| Dominio | Subdominio `*.vercel.app` por ahora | Free | $0 |
| **TOTAL MVP** | | | **$0/mes** |

### Límites a tener en cuenta (free tier)
- Vercel Hobby: 100GB bandwidth/mes, 10s timeout en funciones serverless (alcanza para nuestro caso).
- Vercel Hobby: límite de 4.5MB de body en requests serverless → **PDFs deben ser ≤4MB**. Resolverlo con validación client-side.
- Gemini Flash free: 1500 requests/día, 15 RPM. Con 3-5 PDFs/semana sobra.
- GitHub: sin límites relevantes para nuestro uso.
- Cloudflare Tunnel: ilimitado para uso personal.

---

## 4. Arquitectura general

```
┌──────────────────┐
│ Vendedor manda   │
│  PDF por WhatsApp│
│  (manual a vos)  │
└────────┬─────────┘
         │ vos recibís el PDF
         ▼
┌──────────────────────┐         ┌──────────────────┐
│  Dashboard Admin     │ POST    │  n8n webhook     │
│  (Astro SSR)         │────────▶│  (vía Cloudflare │
│  /admin              │  PDF    │   Tunnel)        │
└────────┬─────────────┘         └────────┬─────────┘
         │ polling                         │
         │                                 ▼
         │                        ┌──────────────────┐
         │                        │  Extract text /  │
         │                        │  Vision LLM      │
         │                        │  (Gemini Flash)  │
         │                        └────────┬─────────┘
         │                                 │ JSON
         │                                 ▼
         │                        ┌──────────────────┐
         │                        │  Validate +      │
         │                        │  slug uniqueness │
         │                        └────────┬─────────┘
         │                                 │
         │                                 ▼
         │                        ┌──────────────────┐
         │                        │  GitHub commit   │
         │                        │  content/        │
         │                        │  restaurants/    │
         │                        │  <slug>.json     │
         │                        └────────┬─────────┘
         │                                 │
         │                                 ▼
         │                        ┌──────────────────┐
         │                        │  Vercel auto-    │
         │                        │  deploy (~30-60s)│
         │                        └────────┬─────────┘
         │                                 │
         ▼                                 ▼
┌──────────────────────┐         ┌──────────────────┐
│  Dashboard ve el     │         │  URL pública     │
│  nuevo restaurante   │         │  /r/<slug>       │
└──────────────────────┘         └──────────────────┘
                                          │
                                          ▼
                                  ┌──────────────────┐
                                  │  Vos copiás la   │
                                  │  URL → vendedor  │
                                  │  → restaurante   │
                                  └──────────────────┘
```

---

## 5. Setup inicial (one-time, antes de codear)

Hacé estos pasos ANTES de empezar a programar. Te dejan el entorno listo.

### 5.1 Cuentas y credenciales
1. **GitHub**: crear repo nuevo, privado o público (recomiendo público — los menús son SEO-friendly). Sugerencia de nombre: `menudigital-platform`.
2. **Vercel**: crear cuenta gratis, conectar al repo.
3. **Google AI Studio**: https://aistudio.google.com → crear API key gratis para Gemini.
4. **Cloudflare**: crear cuenta gratis. No hace falta dominio.

### 5.2 Cloudflare Tunnel (para exponer n8n local a internet)
```bash
brew install cloudflared
cloudflared tunnel login
cloudflared tunnel create n8n-local
cloudflared tunnel route dns n8n-local n8n.tudominio-cloudflare.com
# Configurar y correr:
cloudflared tunnel run --url http://localhost:5678 n8n-local
```
Resultado: tu n8n local tiene URL pública estable (ej: `https://n8n-abc.tudominio.workers.dev`).

> **Alternativa si no querés dominio**: `cloudflared tunnel --url http://localhost:5678` da una URL aleatoria (`*.trycloudflare.com`) sin necesidad de cuenta. Más simple para empezar, menos estable.

### 5.3 Variables de entorno
Necesitamos en Vercel y/o `.env.local`:

```bash
# Auth admin
ADMIN_USER=tu_usuario
ADMIN_PASS=password_largo_y_random

# GitHub (para que el dashboard lea/escriba)
GITHUB_TOKEN=ghp_xxx   # PAT con permisos repo
GITHUB_OWNER=tu_user
GITHUB_REPO=menudigital-platform
GITHUB_BRANCH=main

# n8n webhook
N8N_WEBHOOK_URL=https://n8n-abc.tudominio.workers.dev/webhook/new-pdf
N8N_WEBHOOK_SECRET=otro_token_random
```

En n8n (variables del workflow):
```bash
GEMINI_API_KEY=...
GITHUB_TOKEN=ghp_xxx   # Mismo PAT
GITHUB_OWNER=tu_user
GITHUB_REPO=menudigital-platform
WEBHOOK_SECRET=otro_token_random   # Mismo que en Vercel
```

---

## 6. Estructura del repo

```
menudigital-platform/
├── README.md
├── package.json
├── astro.config.mjs
├── tsconfig.json
├── .env.example
│
├── content/
│   └── restaurants/
│       └── .gitkeep                  ← arranca vacío; n8n agrega los JSON
│
├── schema/
│   └── menu.schema.json              ← JSON Schema (draft 2020-12)
│
├── public/
│   └── favicon.svg
│
├── src/
│   ├── pages/
│   │   ├── index.astro               ← landing pública con lista de restaurantes activos
│   │   ├── r/
│   │   │   └── [slug]/
│   │   │       ├── index.astro       ← menú del restaurante
│   │   │       └── [dish].astro      ← detalle de plato
│   │   ├── admin/
│   │   │   ├── index.astro           ← dashboard: lista de restaurantes
│   │   │   └── r/
│   │   │       └── [slug].astro      ← detalle/preview/acciones de 1 restaurante
│   │   └── api/
│   │       ├── admin/
│   │       │   ├── upload.ts         ← POST: recibe PDF y lo reenvía a n8n
│   │       │   ├── restaurants.ts    ← GET: lista (con polling desde el front)
│   │       │   ├── toggle.ts         ← POST: oculta/muestra un restaurante
│   │       │   └── delete.ts         ← POST: elimina un restaurante
│   │       └── health.ts             ← GET: para verificar deploy
│   │
│   ├── components/
│   │   ├── menu/
│   │   │   ├── RestaurantHeader.astro
│   │   │   ├── MenuNav.astro         ← sticky con secciones
│   │   │   ├── MenuSection.astro
│   │   │   ├── MenuItem.astro
│   │   │   ├── DishDetail.astro
│   │   │   ├── SearchBar.astro       ← isla cliente
│   │   │   └── Footer.astro
│   │   └── admin/
│   │       ├── RestaurantList.astro
│   │       ├── UploadModal.tsx       ← isla React: input file + polling
│   │       ├── MissingFieldsWarning.astro
│   │       └── ActionButtons.astro
│   │
│   ├── lib/
│   │   ├── github.ts                 ← Octokit wrapper (read/write content/)
│   │   ├── restaurants.ts            ← carga + valida JSONs
│   │   ├── auth.ts                   ← basic auth helper
│   │   ├── slug.ts                   ← generateSlug() + verificación de unicidad
│   │   └── search.ts                 ← lógica de búsqueda accent-insensitive
│   │
│   ├── middleware.ts                 ← protege /admin/* y /api/admin/* con basic auth
│   │
│   ├── styles/
│   │   ├── global.css
│   │   ├── menu.css
│   │   ├── detail.css
│   │   └── admin.css
│   │
│   └── types/
│       └── restaurant.ts             ← tipos TS generados del schema
│
├── scripts/
│   ├── validate-menus.mjs            ← valida todos los JSON contra schema
│   └── generate-types.mjs            ← schema → TypeScript
│
├── n8n/
│   ├── workflow.json                 ← export del workflow versionado
│   ├── prompts/
│   │   └── extract-menu.md           ← prompt del LLM, versionado
│   └── README.md                     ← cómo importar el workflow
│
└── .github/
    └── workflows/
        └── validate.yml              ← valida JSON en cada push
```

---

## 7. Schema del `menu.json` (definitivo)

Cada restaurante = un archivo `content/restaurants/<slug>.json` con esta estructura:

```json
{
  "$schema": "../../schema/menu.schema.json",
  "slug": "la-veredita-de-augusto",
  "status": "active",
  "version": 1,
  "createdAt": "2026-05-16T12:00:00Z",
  "updatedAt": "2026-05-16T12:00:00Z",

  "_meta": {
    "sourcePdfName": "menu-augusto-mayo2026.pdf",
    "extractedBy": "gemini-2.0-flash",
    "missingFields": [
      "info.social.whatsapp.number",
      "info.schedule"
    ]
  },

  "info": {
    "name": "La Veredita de Augusto",
    "location": "Cofico, Córdoba",
    "subtitle": "Con sabor a barrio",
    "since": "2011",
    "description": "Tapas italianas, vermuts y aperitivos.",
    "schedule": "_dato no disponible_",
    "social": {
      "instagram": { "url": "https://instagram.com/augustopastas", "handle": "@augustopastas" },
      "whatsapp": { "number": "_dato no disponible_", "message": "Hola! Me interesa reservar." }
    },
    "theme": {
      "primaryColor": "#C62828",
      "backgroundColor": "#F9F5EA",
      "textColor": "#1A1A1A",
      "accentColor": "#B32D2D",
      "fonts": {
        "heading": "Georgia, serif",
        "body": "'Helvetica Neue', sans-serif"
      }
    }
  },

  "menuSections": [
    {
      "id": "tapas-calientes",
      "title": "Tapas Calientes",
      "items": ["papas-bravas", "langostinos-al-oporto"]
    }
  ],

  "items": {
    "papas-bravas": {
      "slug": "papas-bravas",
      "name": "Papas Bravas",
      "price": "5500",
      "shortDescription": "Con salsa picante de la casa",
      "description": "Papas crocantes con nuestra salsa brava y alioli.",
      "ingredients": ["Papa", "Ají picante", "Ajo", "Aceite de oliva"],
      "type": "Tapa caliente",
      "icon": "🥔"
    }
  }
}
```

### Reglas

| Campo | Tipo | Reglas |
|---|---|---|
| `slug` | string kebab-case | Debe matchear el nombre del archivo. Único en el repo. |
| `status` | `"active"` \| `"hidden"` | `hidden` = URL pública devuelve 404. JSON queda en el repo. |
| `version` | int | Auto-incrementa cada update. |
| `_meta.missingFields[]` | string[] | Lista de paths dotnotation que el LLM no encontró. El dashboard los muestra como warnings. |
| Cualquier string que el LLM no pudo extraer | `"_dato no disponible_"` | Sentinela. El frontend lo renderiza como placeholder o lo oculta. |
| `info.theme.*` | hex | Si el LLM no detecta colores, defaultear a tema neutro (`#2C2C2C` / `#FAFAFA` / negro / gris) y agregar a `missingFields`. |
| `info.theme.fonts.*` | CSS font-family | Si el LLM no detecta, defaultear a `Georgia, serif` / `Helvetica, sans-serif`. |
| `items.*.price` | string | Sin símbolo `$`. El frontend formatea como `$5.500` (formato AR). |
| `items.*.icon` | emoji | El LLM asigna por categoría (🍕🍝🥗🍷🥘 etc.). Siempre presente. |
| `items.*.image` | omitido en MVP | No se procesa. |
| `menuSections[].items[]` | slug[] | Cada uno DEBE existir en `items{}`. CI valida esto. |

> No hay `manifest.json` separado. El frontend escanea `content/restaurants/*.json` en build time (`import.meta.glob`).

---

## 8. Frontend público

### 8.1 Landing (`/`)
- Renderizado estático (SSG) en build time.
- Lista los restaurantes con `status: "active"` (lee de `content/restaurants/*.json`).
- Cada uno como tarjeta clickeable.
- Diseño minimal: fondo oscuro, tarjetas con hover.

### 8.2 Menú del restaurante (`/r/<slug>/`)
- Renderizado estático para cada `<slug>` activo.
- Si `status: "hidden"` → la ruta no se genera → 404.
- **Componentes** (heredados del proyecto viejo, ver §15 del brief):
  - Header con logo (si hay), nombre, subtitle, Instagram.
  - Nav sticky con secciones del menú + buscador integrado.
  - Secciones con título + items (nombre, descripción corta, precio).
  - Footer con copyright + "desde \<año\>".
- **Theming**: vía `<style define:vars={...}>` por restaurante, leyendo `info.theme`.
- **Búsqueda**: accent-insensitive con highlight (rescatable del proyecto viejo).
- **Click en item → `/r/<slug>/<dish-slug>/`**.

### 8.3 Detalle de plato (`/r/<slug>/<dish>/`)
- Renderizado estático.
- Muestra: nombre, categoría, descripción larga, ingredientes, tipo, precio destacado.
- Botón "volver" con `history.back()` y fallback a `/r/<slug>/`.

### 8.4 Comportamiento ante datos faltantes
- Campos con `"_dato no disponible_"`: ocultar o mostrar placeholder neutral.
- Items con `description` vacío: ocultar la sección de descripción.
- Sin Instagram: ocultar el botón.
- Sin WhatsApp: ocultar el botón flotante (cuando exista).

---

## 9. Dashboard admin

> Protegido por basic auth (middleware en `src/middleware.ts`). Una sola cuenta desde env vars.

### 9.1 Lista de restaurantes (`/admin`)
Tabla con columnas:
| Nombre | Slug | Estado | Última actualización | Warnings | Acciones |

Acciones por fila:
- **Ver menú** → abre `/r/<slug>/` en nueva pestaña.
- **Editar JSON** → abre `https://github.com/<owner>/<repo>/edit/main/content/restaurants/<slug>.json`.
- **Ocultar / Mostrar** → toggle `status` vía `POST /api/admin/toggle`.
- **Eliminar** → confirmar → `POST /api/admin/delete` (borra el JSON via GitHub API).

Arriba: botón grande **"+ Nuevo menú"** → abre modal (sección 9.2).

Lista se carga desde GitHub API en server-side (siempre actualizada, no espera deploy).

### 9.2 Modal "Nuevo menú"
Componente React isla (`UploadModal.tsx`):
1. Input file (solo `.pdf`, max 4MB validado client-side).
2. Botón "Procesar".
3. Al hacer click → `POST /api/admin/upload` con el PDF.
4. La ruta API forwardea el PDF al webhook de n8n (`N8N_WEBHOOK_URL`) con header `X-Webhook-Secret`.
5. n8n responde con `{ executionId, slug }` inmediatamente (modo async).
6. El modal entra en modo "procesando..." y empieza a hacer polling cada 3s a `GET /api/admin/restaurants?slug=<slug>`.
7. Cuando el restaurante aparece en la lista → modal muestra "¡Listo!" + link a `/r/<slug>/` + botón "Copiar URL".
8. El menú público va a estar accesible una vez que Vercel termine el rebuild (~30-60s después del commit). Mostrar mensaje "El menú será accesible en ~1 minuto mientras se publica".

### 9.3 Detalle de restaurante (`/admin/r/<slug>`)
- Preview embebido del menú (iframe a `/r/<slug>/`).
- JSON crudo en `<pre>` para auditoría rápida.
- Listado de `_meta.missingFields[]` con explicación.
- Mismas acciones que en la lista.

### 9.4 Endpoints API (`src/pages/api/admin/`)

```typescript
// POST /api/admin/upload
// Body: multipart/form-data con campo "pdf"
// Acción: validar tamaño, reenviar al webhook de n8n
// Response: { executionId, expectedSlug } o { error }

// GET /api/admin/restaurants
// Response: Array<{ slug, name, status, updatedAt, missingFieldsCount }>
// Lee de GitHub API en tiempo real (no espera build)

// POST /api/admin/toggle
// Body: { slug, status: "active" | "hidden" }
// Acción: lee JSON, modifica status, commit. Trigger Vercel rebuild.

// POST /api/admin/delete
// Body: { slug }
// Acción: borra el archivo via GitHub API. Trigger Vercel rebuild.
```

---

## 10. Pipeline n8n (nuevo, desde cero)

### 10.1 Nodos en orden

```
Webhook (POST /webhook/new-pdf)
  ↓
Validar secret + tipo de archivo (Code)
  ↓
Extraer texto del PDF (extractFromFile)
  ↓
Detectar si hay texto suficiente (IF: text.length > 100)
  ↓                            ↓
  SÍ                           NO (PDF escaneado)
  ↓                            ↓
  Llamar a Gemini (texto)      Convertir PDF a imágenes + Gemini Vision
  ↓                            ↓
  └──────────┬─────────────────┘
             ↓
  Parse + validar JSON (Code con ajv)
             ↓
  Listar restaurantes existentes (HTTP GitHub API)
             ↓
  Generar slug único (Code: si colisiona, sufijar -2, -3, ...)
             ↓
  Commit JSON a GitHub (HTTP GitHub API: PUT /repos/.../contents/...)
             ↓
  Respond to Webhook (slug, expectedUrl)
```

### 10.2 Configuración de cada nodo

**1. Webhook Trigger**
- Path: `/webhook/new-pdf`
- Method: POST
- Response Mode: "When Last Node Finishes"
- Authentication: Header Auth (`X-Webhook-Secret` matchea env var)

**2. Validar (Code)**
- Check: `binary.pdf` existe, mimeType es `application/pdf`, tamaño ≤ 4MB.
- Si falla → throw error → respond 400.

**3. Extract from File**
- Operation: `pdf`
- Output: `$json.text`

**4. IF: text length**
- Condition: `{{ $json.text.length }} > 100`

**5a. Llamar Gemini con texto** (HTTP Request)
- URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={{$env.GEMINI_API_KEY}}`
- Method: POST
- Body: ver §11 (prompt + responseSchema)
- Importante: usar `response_mime_type: "application/json"` y `response_schema` para forzar JSON válido.

**5b. Llamar Gemini con imágenes** (HTTP Request)
- Convertir páginas del PDF a imágenes primero (con `pdfImages` u OCR previo).
- O bien: pasar el PDF directo a Gemini que lo soporta como input (file API).
- Mismo prompt + schema.

**6. Parse + validar JSON (Code)**
- Parse el text response (ya viene en JSON por el responseSchema).
- Validar contra `menu.schema.json` con `ajv`. Si falla:
  - Retry 1: reenviar a Gemini con feedback del error.
  - Retry 2: idem.
  - Tras 3 intentos → throw → respond 500 con detalle.

**7. Listar restaurantes existentes** (HTTP GitHub)
- GET `/repos/{owner}/{repo}/contents/content/restaurants`
- Devuelve lista de archivos `<slug>.json`.

**8. Generar slug único (Code)**
```js
const baseSlug = $json.slug; // viene del LLM
const existing = $('Listar restaurantes existentes').first().json
  .map(f => f.name.replace('.json', ''));
let finalSlug = baseSlug;
let i = 2;
while (existing.includes(finalSlug)) {
  finalSlug = `${baseSlug}-${i++}`;
}
return [{ json: { ...$json, slug: finalSlug } }];
```

**9. Commit JSON a GitHub** (HTTP Request)
- Method: PUT
- URL: `https://api.github.com/repos/{{$env.GITHUB_OWNER}}/{{$env.GITHUB_REPO}}/contents/content/restaurants/{{$json.slug}}.json`
- Headers: `Authorization: Bearer {{$env.GITHUB_TOKEN}}`
- Body:
  ```json
  {
    "message": "feat(content): add {{ $json.slug }}",
    "content": "{{ base64 del JSON }}",
    "branch": "main"
  }
  ```

**10. Respond to Webhook**
- Response: `{ slug: $json.slug, expectedUrl: "https://<vercel-url>/r/<slug>/" }`

### 10.3 Manejo de errores
- Cada nodo crítico (Gemini, GitHub) con `retryOnFail: true` (3 intentos, 5s backoff).
- Si todo el flujo falla → respond 500 + log a un Google Sheet (opcional) o solo n8n logs.

---

## 11. Prompt del LLM (versión 1)

Guardar en `n8n/prompts/extract-menu.md`. El nodo n8n lo lee al hacer la request a Gemini.

```markdown
Eres un asistente experto en gastronomía y diseño UI. Tu tarea es analizar el
PDF (o texto del PDF) de un menú de restaurante argentino y generar un JSON
estructurado para una plataforma de menús digitales.

OBJETIVO: Que el JSON resulte en una web atractiva y vendible. La estructura
visual es fija — vos solo decidís CONTENIDO + ESTÉTICA (colores, tipografía).

REGLAS GENERALES:
1. Idioma: español argentino. Respetá los nombres de platos como están en el PDF.
2. Precios: solo el número (string), sin "$" ni puntos. Ej: "5500", no "$5.500".
3. Slugs: kebab-case, sin acentos, sin caracteres especiales. Ej: "papas-bravas".
4. Si un dato no aparece en el PDF, escribí literalmente "_dato no disponible_"
   y agregalo a `_meta.missingFields` con su path (ej: "info.schedule").
5. Para cada item asignale un emoji `icon` según categoría:
   pizza:🍕, pasta:🍝, ensalada:🥗, carne:🥩, hamburguesa:🍔, pescado:🐟,
   postre:🍰, vino:🍷, cerveza:🍺, café:☕, bebida:🥤, sushi:🍣, sopa:🍲,
   tapa:🍢, vermut:🍹, picada:🧀, sandwich:🥪, fritura:🍟, default:🍽️.

ESTÉTICA (lo más importante para la venta):
6. Analizá el PDF visualmente: colores predominantes, tipografía usada, estilo
   general (rústico, moderno, italiano, minimalista, etc.).
7. Elegí 4 colores hex coherentes con la marca del restaurante:
   - primaryColor: color de acento (botones, links, títulos).
   - backgroundColor: fondo principal.
   - textColor: color del texto.
   - accentColor: secundario (decoración).
8. Elegí 2 fuentes que matcheen el estilo:
   - heading: serif si es clásico/elegante; sans-serif si es moderno; cursive
     si es artesanal. Usá fuentes web estándar: Georgia, Playfair Display,
     Lora, Merriweather, Bebas Neue, Oswald, Montserrat, Inter, Roboto,
     Helvetica, etc.
   - body: legible, sans-serif preferentemente.
9. Si no podés inferir colores/fuentes del PDF, usá defaults neutros y agregá
   los paths a missingFields.

ESTRUCTURA: respondé EXACTAMENTE el JSON con el schema indicado en
response_schema. Nada más, nada menos. Sin markdown, sin explicaciones.

CAMPOS OBLIGATORIOS MÍNIMOS:
- info.name (nombre del restaurante).
- al menos 1 sección con al menos 1 item.

Si el PDF no es un menú de restaurante → respondé con
`{"error": "no_es_menu", "message": "..."}` y nada más.
```

> El `response_schema` que se pasa a Gemini debe ser el `menu.schema.json` del repo, transformado al formato que Gemini espera (subset del OpenAPI Schema). Esto fuerza la respuesta a ser JSON válido y matchear el esquema.

---

## 12. Plan de implementación por fases

Cada fase tiene **criterio de "done"** explícito. No avanzar sin cumplirlo.

### Fase 0 — Setup de entorno (1-2 días)
- [ ] Crear repo en GitHub.
- [ ] Conectar a Vercel.
- [ ] Crear API key de Gemini.
- [ ] Instalar Cloudflare Tunnel + n8n local funcionando con URL pública.
- [ ] `npm create astro@latest` con template mínimo + TypeScript strict.
- [ ] Crear `menu.schema.json` (§7).
- [ ] Script `scripts/validate-menus.mjs` con `ajv`.
- [ ] `.github/workflows/validate.yml` corriendo en cada push.

**Done cuando**: push al repo dispara validación + deploy a Vercel exitoso.

### Fase 1 — Frontend público con data hardcodeada (2-3 días)
- [ ] Crear 2 JSON de prueba en `content/restaurants/` (basados en `menus/augusto/config.js` del proyecto viejo).
- [ ] Componentes Astro del menú (Header, MenuNav, MenuSection, MenuItem, DishDetail, SearchBar, Footer).
- [ ] Rutas `/`, `/r/[slug]/`, `/r/[slug]/[dish]/`.
- [ ] Theming vía `<style define:vars>`.
- [ ] Búsqueda accent-insensitive con highlight.
- [ ] Estilos responsive mobile-first.

**Done cuando**: vos abrís `/r/la-veredita-de-augusto/` desde el deploy de Vercel y el menú se ve completo, navegable y bonito.

### Fase 2 — Dashboard admin sin upload (1-2 días)
- [ ] Middleware con basic auth.
- [ ] Página `/admin` que lista restaurantes desde GitHub API (`src/lib/github.ts`).
- [ ] Página `/admin/r/[slug]` con preview + acciones.
- [ ] Endpoints `toggle` y `delete`.
- [ ] Render de warnings de `_meta.missingFields`.

**Done cuando**: vos podés ocultar/mostrar/eliminar restaurantes desde el dashboard y los cambios se reflejan en el sitio público tras el rebuild.

### Fase 3 — n8n pipeline (3-5 días)
- [ ] Construir workflow en n8n siguiendo §10.
- [ ] Probar con 1 PDF "fácil" (texto seleccionable, layout simple).
- [ ] Probar con 1 PDF "difícil" (escaneado, multi-columna).
- [ ] Iterar el prompt hasta que ambos casos generen JSON válido y completo.
- [ ] Exportar workflow a `n8n/workflow.json` (commitearlo).
- [ ] Commitear `n8n/prompts/extract-menu.md`.

**Done cuando**: enviás un PDF al webhook de n8n con curl y aparece un commit en GitHub con el JSON correcto.

### Fase 4 — Upload desde el dashboard (1-2 días)
- [ ] Componente React `UploadModal.tsx` con file input + polling.
- [ ] Endpoint `/api/admin/upload` que forwardea al webhook de n8n.
- [ ] Manejo de errores (PDF muy grande, formato incorrecto, n8n caído).
- [ ] Mensajes de estado claros durante el procesamiento.

**Done cuando**: subís un PDF desde `/admin`, esperás ~1 minuto y aparece el nuevo restaurante listo para mostrar.

### Fase 5 — Hardening y testing (2-3 días)
- [ ] Conseguir 5-10 PDFs reales de menús variados.
- [ ] Procesarlos todos y revisar la calidad del output.
- [ ] Iterar prompt según los errores que aparezcan.
- [ ] Documentar en `README.md` cómo correr el sistema completo localmente.
- [ ] Documentar en `n8n/README.md` cómo importar/configurar el workflow.

**Done cuando**: 8 de cada 10 PDFs generan menús "vendibles" sin edición manual.

### Fase 6 (opcional) — Eval set automatizado
- [ ] Carpeta `evals/` con pares PDF + JSON esperado.
- [ ] Script que corre el LLM contra los PDFs y compara con golden output.
- [ ] CI corre los evals en cada cambio del prompt.

**Done cuando**: cambiar el prompt te avisa automáticamente si introduce regresiones.

---

## 13. Convenciones

### Naming
- **Slugs**: kebab-case, sin acentos, sin caracteres especiales. Ej: `la-veredita-de-augusto`.
- **Branches**: `main` (único, no usamos feature branches en MVP).
- **Commits**: `feat(content): add <slug>` / `fix(content): update <slug>` / `chore(admin): hide <slug>`. n8n usa este formato.
- **Componentes Astro**: PascalCase, sin sufijo (`MenuItem.astro`).
- **Componentes React**: PascalCase con extensión `.tsx`.

### Estructura del código
- **No exportar tipos desde múltiples lugares**. Tipos solo desde `src/types/`.
- **Toda interacción con GitHub** pasa por `src/lib/github.ts`. Nunca llamar Octokit directo desde un componente.
- **Validación**: usar `ajv` con el schema. Siempre. Nunca confiar en que el JSON sea válido.
- **Sin globals**. No replicar el `restaurantConfig` global del proyecto viejo.

### Estilos
- CSS variables para theming (heredado del proyecto viejo, funciona bien).
- Mobile-first.
- Sin frameworks pesados (no Tailwind). CSS puro o CSS modules.
- Sin emojis en código salvo en `items[].icon` (esos son data, no decoración).

---

## 14. Qué hacer cuando empieces a construir

1. **Leé este plan completo antes de tipear nada**. Cada decisión tiene una razón.
2. **No reutilices código del proyecto viejo "tal cual"**. Releé la lógica, entendela, reimplementala en la nueva arquitectura. El proyecto viejo es referencia visual, no codebase.
3. **No mejores cosas que no están en el plan** sin discutirlo primero. Si encontrás algo que cambiarías, pará y consultá. La idea es que el MVP sea predecible.
4. **Avanzá fase por fase**, marcando los "done". No mezclar fases.
5. **Si el LLM (Gemini) se rompe con un PDF**, no parches el prompt en caliente. Anotalo, terminá la fase, después iteramos con eval set.
6. **El `n8n/workflow.json` SIEMPRE se commitea**. Cada cambio que hagas en el workflow → export → commit.

---

## 15. Apéndice: lo que se hereda del proyecto viejo (rescatable como referencia visual/lógica)

Path: `/Users/xavier/Proyectos/Agusto Pastas/Menu-Augusto-Pastas/`

| Archivo viejo | Para qué referirlo |
|---|---|
| `menus/augusto/config.js` | Modelo de datos más rico (ver qué campos rescatar/descartar). |
| `script.js` | Lógica de render del menú + búsqueda accent-insensitive + nav sticky. |
| `detalle.js` | Render del detalle de plato + manejo de pairing/ingredients. |
| `styles.css` + `detalle-styles.css` + `search-styles.css` | UI base — copiable a Astro adaptando selectores. |

**Funciones específicas a portar tal cual** (están bien y son tests-passing):

```js
// Slug accent-insensitive
function generateSlug(name) {
  return name.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Normalización para búsqueda
function normalizeText(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '');
}
```

---

## 16. Roadmap post-MVP (cuando haya 5+ restaurantes activos)

Lista priorizada para v2, en este orden:

1. **Extracción de imágenes del PDF** (logos, fotos de platos) → Vercel Blob o Cloudinary free.
2. **Editor visual en el dashboard** (en vez de link a GitHub) → forms + commit programático.
3. **Bot de WhatsApp** para que los vendedores manden PDFs directo (sin pasar por vos).
4. **Eval set automatizado** del LLM (§12 Fase 6).
5. **Analytics simples** (Plausible o Vercel Analytics).
6. **QR generator** por restaurante.
7. **Notificaciones** (WhatsApp/email) cuando un menú está listo.
8. **Custom domain por restaurante**.
9. **Panel del restaurante** para que ellos editen.
10. **Suscripción/pago automatizado** (Mercado Pago).

---

**Fin del plan.** Cualquier ambigüedad que encuentres mientras construís es un bug del plan — anotalo y lo resolvemos antes de implementar.
