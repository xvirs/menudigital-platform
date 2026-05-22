// Toma el extracted de Gemini, lo envuelve en el formato completo del
// schema (status, version, dates, _meta, theme defaults, etc), genera
// un slug único contra el repo, y commitea via GitHub Contents API.

const input = $input.first().json;
if (!input?.ok || !input?.extracted) {
  // Pass-through del error del nodo anterior.
  return [{ json: input }];
}
const ext = input.extracted;

const owner = $env.GITHUB_OWNER;
const repo = $env.GITHUB_REPO;
const branch = $env.GITHUB_BRANCH || 'main';
const token = $env.GITHUB_TOKEN;
if (!owner || !repo || !token) {
  return [{
    json: {
      ok: false,
      error: 'github_env_missing',
      message: 'Missing GITHUB_OWNER / GITHUB_REPO / GITHUB_TOKEN env vars.'
    }
  }];
}

// Slug helper: kebab-case ASCII, sin acentos.
function makeSlug(name) {
  return String(name || 'restaurant')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

let baseSlug = makeSlug(ext?.info?.name);
if (baseSlug.length < 3) baseSlug = 'restaurant';

// Resolver slug único contra el repo. ignoreHttpStatusErrors=true para que
// el helper devuelva la response en lugar de throw en 404.
const self = this;
async function existsInRepo(slug) {
  const resp = await self.helpers.httpRequest({
    method: 'GET',
    url: `https://api.github.com/repos/${owner}/${repo}/contents/content/restaurants/${slug}.json?ref=${branch}`,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    json: true,
    returnFullResponse: true,
    ignoreHttpStatusErrors: true,
  });
  if (resp.statusCode === 200) return true;
  if (resp.statusCode === 404) return false;
  throw new Error('Unexpected status checking slug uniqueness: ' + resp.statusCode);
}

let slug = baseSlug;
let n = 2;
try {
  while (await existsInRepo(slug)) {
    slug = `${baseSlug}-${n++}`;
    if (n > 50) throw new Error('Too many slug collisions (>50)');
  }
} catch (err) {
  return [{
    json: {
      ok: false,
      error: 'github_slug_check_failed',
      message: 'Checking slug uniqueness failed: ' + (err?.message ?? String(err))
    }
  }];
}

// Construir el JSON completo según el schema.
const now = new Date().toISOString();
const defaultTheme = {
  primaryColor: '#2C2C2C',
  backgroundColor: '#FAFAFA',
  textColor: '#1A1A1A',
  accentColor: '#777777',
  fonts: {
    heading: 'Georgia, serif',
    body: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
};

const restaurant = {
  $schema: '../../schema/menu.schema.json',
  slug,
  status: 'active',
  version: 1,
  createdAt: now,
  updatedAt: now,
  _meta: {
    sourcePdfName: 'webhook-upload.pdf',
    extractedBy: 'gemini-2.0-flash',
    missingFields: [],
  },
  info: {
    name: ext?.info?.name || '_dato no disponible_',
    ...(ext?.info?.location ? { location: ext.info.location } : {}),
    ...(ext?.info?.subtitle ? { subtitle: ext.info.subtitle } : {}),
    ...(ext?.info?.description ? { description: ext.info.description } : {}),
    theme: ext?.info?.theme ?? defaultTheme,
  },
  menuSections: Array.isArray(ext?.menuSections) ? ext.menuSections : [],
  items: (ext?.items && typeof ext.items === 'object') ? ext.items : {},
};

// Sanity defaults en cada item.
for (const [key, item] of Object.entries(restaurant.items)) {
  if (item && typeof item === 'object') {
    item.slug = item.slug || key;
    item.name = item.name || key;
    item.icon = item.icon || '🍽️';
    if (item.price === undefined || item.price === null || item.price === '') {
      item.price = '_dato no disponible_';
    } else {
      item.price = String(item.price);
    }
  }
}

// Validación mínima.
if (!restaurant.info.name || restaurant.menuSections.length === 0 || Object.keys(restaurant.items).length === 0) {
  return [{
    json: {
      ok: false,
      error: 'invalid_restaurant_structure',
      message: 'Restaurant JSON invalid: empty name / no sections / no items.'
    }
  }];
}

const content = JSON.stringify(restaurant, null, 2) + '\n';
const contentB64 = Buffer.from(content, 'utf8').toString('base64');

// Commit via GitHub Contents API.
let commitResp;
try {
  commitResp = await this.helpers.httpRequest({
    method: 'PUT',
    url: `https://api.github.com/repos/${owner}/${repo}/contents/content/restaurants/${slug}.json`,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    body: { message: `feat(content): add ${slug}`, content: contentB64, branch },
    json: true,
  });
} catch (err) {
  return [{
    json: {
      ok: false,
      error: 'github_commit_failed',
      message: 'GitHub commit failed: ' + (err?.message ?? String(err)).slice(0, 500)
    }
  }];
}

return [{
  json: {
    ok: true,
    slug,
    publicUrl: `https://menudigital-platform.vercel.app/r/${slug}/`,
    commitSha: commitResp?.commit?.sha,
    commitUrl: commitResp?.commit?.html_url,
    itemsCount: Object.keys(restaurant.items).length,
    sectionsCount: restaurant.menuSections.length,
  },
}];
