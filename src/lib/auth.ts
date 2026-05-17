import { timingSafeEqual } from 'node:crypto';

export const AUTH_REALM = 'menudigital-platform admin';

export function unauthorizedResponse(): Response {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${AUTH_REALM}", charset="UTF-8"`,
    },
  });
}

export function isAuthorized(request: Request): boolean {
  const header = request.headers.get('authorization');
  if (!header || !header.startsWith('Basic ')) return false;

  let decoded: string;
  try {
    decoded = atob(header.slice('Basic '.length).trim());
  } catch {
    return false;
  }

  const colonIdx = decoded.indexOf(':');
  if (colonIdx === -1) return false;

  const user = decoded.slice(0, colonIdx);
  const pass = decoded.slice(colonIdx + 1);

  const expectedUser = import.meta.env.ADMIN_USER;
  const expectedPass = import.meta.env.ADMIN_PASS;

  if (!expectedUser || !expectedPass) return false;

  return safeEqual(user, expectedUser) && safeEqual(pass, expectedPass);
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) {
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}
