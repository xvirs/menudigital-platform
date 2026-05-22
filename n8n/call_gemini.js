// Llama a Gemini 2.0 Flash con prompt que pide los datos del menú.
// Devuelve el JSON extraído tal cual lo dió el LLM.

const inputJson = $input.first().json;

// Check if Validate Secret failed (since Extract PDF Text node might swallow its output)
try {
  const validateJson = $('Validate Secret').first().json;
  if (validateJson && validateJson.ok === false) {
    return [{ json: validateJson }];
  }
} catch (e) {
  // Fallback if node not found or not executed
}

// Check if a previous node (like Validate Secret) already failed and sent an error
if (inputJson && inputJson.ok === false) {
  return [{ json: inputJson }];
}

// Check if text extraction failed (Extract PDF Text node failed but continued)
if (inputJson && (inputJson.error || !inputJson.text)) {
  const errMsg = inputJson.error?.message ?? inputJson.message ?? 'No text extracted from PDF';
  return [{
    json: {
      ok: false,
      error: 'pdf_extraction_failed',
      message: 'Failed to extract text from PDF: ' + errMsg
    }
  }];
}

const pdfText = (inputJson.text ?? '').trim();
if (!pdfText) {
  return [{
    json: {
      ok: false,
      error: 'no_text_extracted',
      message: 'No text extracted from PDF (probablemente PDF escaneado; Vision LLM no implementado todavía).'
    }
  }];
}

const apiKey = $env.GEMINI_API_KEY;
if (!apiKey) {
  return [{
    json: {
      ok: false,
      error: 'gemini_api_key_not_set',
      message: 'GEMINI_API_KEY not set'
    }
  }];
}

const prompt = `Sos un asistente experto en menús de restaurantes argentinos. Te paso el texto de un menú PDF y tenés que devolver SOLO un JSON con la estructura exacta de abajo. Sin markdown, sin explicaciones, sin texto extra.

ESTRUCTURA:
{
  "info": {
    "name": <nombre REAL del restaurante tal como aparece en el header del menú; NO uses placeholders como "Restaurante Argentino">,
    "location": <ubicación REAL del restaurante si aparece en el PDF, ej "Pueyrredón, Córdoba"; si no aparece usá la string literal "_dato no disponible_">,
    "subtitle": <subtítulo o slogan si aparece; o omití el campo>,
    "description": <descripción corta si aparece; o omití>,
    "theme": {
      "primaryColor": <hex de color de la marca según colores del PDF, ej "#C62828">,
      "backgroundColor": <hex de fondo, ej "#FAFAFA">,
      "textColor": <hex texto, ej "#1A1A1A">,
      "accentColor": <hex acento, variante del primary>,
      "fonts": {
        "heading": <CSS font-family para títulos, ej "Georgia, serif">,
        "body": <CSS font-family para body, ej "'Helvetica Neue', sans-serif">
      }
    }
  },
  "menuSections": [
    { "id": <kebab-case ASCII>, "title": <título humano>, "items": ["<item-slug>", ...] }
  ],
  "items": {
    "<item-slug>": {
      "slug": <mismo que la key>,
      "name": <nombre del plato>,
      "price": <SOLO dígitos como string, ej "5500"; si no encontrás precio usá la string literal "_dato no disponible_">,
      "shortDescription": <descripción corta opcional>,
      "description": <descripción larga opcional>,
      "ingredients": [<si los hay>],
      "type": <categoría libre, ej "Pizza napolitana">,
      "icon": <emoji según categoría: pizza:🍕 pasta:🍝 ensalada:🥗 carne:🥩 hamburguesa:🍔 pescado:🐟 postre:🍰 vino:🍷 cerveza:🍺 café:☕ bebida:🥤 sushi:🍣 sopa:🍲 tapa:🍢 vermut:🍹 picada:🧀 sandwich:🥪 fritura:🍟 pan/focaccia:🥖 empanada:🥟 default:🍽️>
    }
  }
}

REGLAS DURAS:
- Slugs SIEMPRE kebab-case ASCII sin acentos ("papas-bravas", no "papás-bravas").
- Cada slug en menuSections.items DEBE existir en items{}.
- price SIEMPRE string, solo dígitos sin "$" ni puntos ("5500", no "$5.500").
- Idioma español argentino.
- Si el texto NO es un menú: respondé exactamente {"error":"no_es_menu"}.

TEXTO DEL MENÚ:

${pdfText}`;

const payload = {
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
};

const models = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];
let data = null;
let lastError = null;

for (const model of models) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  try {
    data = await this.helpers.httpRequest({
      method: 'POST',
      url: url,
      body: payload,
      json: true,
      headers: { 'Content-Type': 'application/json' },
      returnFullResponse: false,
    });
    lastError = null;
    break;
  } catch (err) {
    const status = err?.httpCode ?? err?.statusCode ?? err?.status ?? '?';
    const body = err?.response?.body ?? err?.message ?? 'unknown';
    const bodyStr = typeof body === 'object' ? JSON.stringify(body) : String(body);
    
    lastError = {
      status,
      message: bodyStr
    };
    
    // If it's a rate limit or resource exhausted, try the next model
    if (status === 429 || status === '429' || bodyStr.includes('RESOURCE_EXHAUSTED') || bodyStr.includes('429')) {
      continue;
    } else {
      break;
    }
  }
}

if (lastError) {
  return [{
    json: {
      ok: false,
      error: 'gemini_api_error',
      message: 'Gemini API error ' + lastError.status + ': ' + lastError.message.slice(0, 400)
    }
  }];
}

const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
let parsed;
try {
  parsed = JSON.parse(raw);
} catch (err) {
  return [{ json: { ok: false, error: 'gemini_returned_invalid_json', rawSample: raw.slice(0, 500) } }];
}

if (parsed?.error === 'no_es_menu') {
  return [{ json: { ok: false, error: 'no_es_menu', message: parsed.message ?? '' } }];
}

return [{
  json: {
    ok: true,
    extracted: parsed,
    pdfCharCount: pdfText.length,
    promptCharCount: prompt.length,
  },
}];
