export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function matchesQuery(text: string, query: string): boolean {
  if (!query) return true;
  return normalizeText(text).includes(normalizeText(query));
}

export function highlightMatch(text: string, query: string): string {
  if (!query) return escapeHtml(text);
  const normalized = normalizeText(text);
  const normalizedQuery = normalizeText(query);
  const idx = normalized.indexOf(normalizedQuery);
  if (idx === -1) return escapeHtml(text);
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);
  return `${escapeHtml(before)}<mark>${escapeHtml(match)}</mark>${escapeHtml(after)}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
