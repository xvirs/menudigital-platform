# n8n workflow — extracción de menú desde PDF

> Workflow self-hosted que consume PDFs subidos desde el dashboard admin
> (`/admin` en Vercel), los procesa con Gemini 2.0 Flash, y commitea el JSON
> resultante a `content/restaurants/<slug>.json` en este repo.

---

## Archivos en esta carpeta

| Archivo | Qué es |
|---|---|
| `workflow.json` | Export del workflow de n8n. **Se versiona en el repo.** Si modificás el workflow en la UI de n8n, re-exportá y commiteá. |
| `prompts/extract-menu.md` | Prompt del LLM. Si lo cambiás, commiteá — queda histórico. |
| `README.md` | Este archivo. |

---

## Cómo correr el workflow localmente

### Pre-requisitos

- **n8n instalado** localmente (`npm install -g n8n`).
- **Cloudflare Tunnel** corriendo para exponer `localhost:5678` a internet
  (Vercel necesita pegarle al webhook).
- **API key de Gemini** (Google AI Studio, free tier).
- **GitHub PAT** con `Contents: Read and write` en este repo.

### Variables de entorno que n8n necesita

En la UI de n8n, ir a **Settings → Variables** y crear:

| Variable | Valor |
|---|---|
| `GEMINI_API_KEY` | tu API key de Google AI Studio |
| `GITHUB_TOKEN` | el mismo PAT que tiene Vercel |
| `GITHUB_OWNER` | `xvirs` |
| `GITHUB_REPO` | `menudigital-platform` |
| `GITHUB_BRANCH` | `main` |
| `WEBHOOK_SECRET` | un token random largo (mismo que `N8N_WEBHOOK_SECRET` en Vercel) |

### Importar el workflow

1. Abrí n8n en `http://localhost:5678`.
2. Sidebar izquierdo → **Workflows** → botón **"+ Create workflow"** → menú `⋯`
   arriba a la derecha → **"Import from File"**.
3. Seleccioná `n8n/workflow.json` del repo clonado.
4. Click en **Save** (arriba a la derecha).
5. Activá el workflow con el toggle **"Active"**.

### Levantar el túnel público

En una terminal aparte (no la de n8n):

```bash
cloudflared tunnel --url http://localhost:5678
```

Copiá la URL `*.trycloudflare.com` que aparece en el output. La vas a usar
como `N8N_WEBHOOK_URL` en Vercel (ver siguiente sección).

> ⚠️ La URL cambia cada vez que reiniciás `cloudflared`. Hay que actualizarla
> en Vercel después de cada reinicio. Para un setup estable, usar un Named
> Tunnel de Cloudflare con dominio propio.

### Cargar el webhook URL en Vercel

En el dashboard de Vercel del proyecto → **Settings → Environment Variables**:

| Variable | Valor |
|---|---|
| `N8N_WEBHOOK_URL` | `https://<tu-url>.trycloudflare.com/webhook/new-pdf` |
| `N8N_WEBHOOK_SECRET` | el mismo `WEBHOOK_SECRET` que cargaste en n8n |

Redeployá Vercel después de cargar/actualizar estas vars.

---

## Probar el endpoint con curl

```bash
curl -X POST https://<tu-url>.trycloudflare.com/webhook/new-pdf \
  -H "X-Webhook-Secret: <tu-WEBHOOK_SECRET>" \
  -F "pdf=@/ruta/a/un/menu.pdf"
```

Si todo va bien, debería responder:

```json
{ "slug": "<nombre-restaurante>", "expectedUrl": "https://menudigital-platform.vercel.app/r/<slug>/" }
```

Y aparecer un commit en GitHub con `feat(content): add <slug>`.

---

## Flujo del workflow (vista rápida)

```
Webhook (POST /webhook/new-pdf)
  → Validate secret + filetype
  → Extract text from PDF
  → IF text.length > 100
      ├── SÍ: Gemini call (text input)
      └── NO: Gemini call (vision input)
  → Parse + validate JSON against menu.schema.json
  → List existing restaurants (GitHub API)
  → Generate unique slug (sufijar -2, -3 si colisiona)
  → Commit JSON to GitHub
  → Respond to webhook with slug + expectedUrl
```

Detalle completo en `PLAN.md` §10.
