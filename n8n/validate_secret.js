// Valida X-Webhook-Secret contra la env var.
const headers = $input.first().json.headers ?? {};
const received =
  headers['x-webhook-secret'] ?? headers['X-Webhook-Secret'];
const expected = $env.WEBHOOK_SECRET;

if (!expected) {
  return [{ json: { ok: false, error: 'webhook_secret_not_set', message: 'WEBHOOK_SECRET not set. Restart n8n with ~/start-n8n.sh.' } }];
}
if (!received) {
  return [{ json: { ok: false, error: 'missing_webhook_secret', message: 'Missing X-Webhook-Secret header.' } }];
}
if (received !== expected) {
  return [{ json: { ok: false, error: 'invalid_webhook_secret', message: 'Invalid X-Webhook-Secret.' } }];
}

return $input.all();
