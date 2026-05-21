import type { APIRoute } from 'astro';

// Bump el timeout de la function a 5 minutos. Gemini puede tardar 60-150s
// procesando un PDF grande, más el commit a GitHub.
export const maxDuration = 300;

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB (increased from 4 MB)

export const POST: APIRoute = async ({ request, redirect }) => {
  const webhookUrl = import.meta.env.N8N_WEBHOOK_URL;
  const webhookSecret = import.meta.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) {
    return redirect(
      `/admin?kind=err&msg=${encodeURIComponent('Falta N8N_WEBHOOK_URL o N8N_WEBHOOK_SECRET en el server.')}`,
      303
    );
  }

  let pdf: File;
  try {
    const form = await request.formData();
    const got = form.get('pdf');
    if (!(got instanceof File)) {
      return redirect(
        `/admin?kind=err&msg=${encodeURIComponent('No se recibió el archivo. Adjuntá un PDF.')}`,
        303
      );
    }
    pdf = got;
  } catch {
    return redirect(
      `/admin?kind=err&msg=${encodeURIComponent('No se pudo leer el form (formato inválido).')}`,
      303
    );
  }

  if (!pdf.size || pdf.size > MAX_BYTES) {
    return redirect(
      `/admin?kind=err&msg=${encodeURIComponent(`El PDF debe pesar entre 1B y ${MAX_BYTES / 1024 / 1024} MB. Recibido: ${(pdf.size / 1024 / 1024).toFixed(2)} MB.`)}`,
      303
    );
  }

  if (pdf.type && pdf.type !== 'application/pdf') {
    return redirect(
      `/admin?kind=err&msg=${encodeURIComponent(`Tipo de archivo inválido: ${pdf.type}. Solo se acepta application/pdf.`)}`,
      303
    );
  }

  // Forwardea el PDF al webhook de n8n con el secret en el header.
  const forwardForm = new FormData();
  forwardForm.append('pdf', pdf, pdf.name || 'upload.pdf');

  let response: Response;
  try {
    response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'X-Webhook-Secret': webhookSecret },
      body: forwardForm,
      signal: AbortSignal.timeout(280_000),
    });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    return redirect(
      `/admin?kind=err&msg=${encodeURIComponent(`Error contactando n8n: ${msg.slice(0, 200)}`)}`,
      303
    );
  }

  if (!response.ok) {
    return redirect(
      `/admin?kind=err&msg=${encodeURIComponent(`n8n respondió ${response.status}. Es probable que el túnel cloudflared esté caído o el secret esté desactualizado.`)}`,
      303
    );
  }

  let body: any;
  try {
    body = await response.json();
  } catch {
    return redirect(
      `/admin?kind=err&msg=${encodeURIComponent('n8n no devolvió JSON válido. Verificá la última execution en la UI de n8n.')}`,
      303
    );
  }

  if (!body?.ok) {
    const err = body?.error ?? 'unknown_error';
    const msg = body?.message ?? '';
    return redirect(
      `/admin?kind=err&msg=${encodeURIComponent(`n8n falló: ${err} ${msg}`.slice(0, 200))}`,
      303
    );
  }

  const slug = body.slug ?? 'unknown';
  const successMsg = `Listo: "${pdf.name}" → /r/${slug}/ (${body.itemsCount ?? '?'} items en ${body.sectionsCount ?? '?'} secciones). Vercel está rebuildeando — accesible en ~1 min.`;
  return redirect(`/admin?kind=ok&msg=${encodeURIComponent(successMsg)}`, 303);
};
