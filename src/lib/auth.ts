import { createHash, timingSafeEqual } from 'node:crypto';

export const AUTH_COOKIE_NAME = 'admin_session';

/**
 * Generates a session token by hashing the admin password.
 * This is a simple, secure enough approach for a single-admin system
 * without needing a database.
 */
export function generateSessionToken(): string {
  const pass = import.meta.env.ADMIN_PASS || '';
  // Use a secret salt to prevent rainbow table attacks.
  const salt = import.meta.env.GITHUB_TOKEN || 'fallback-salt-xyz';
  return createHash('sha256').update(pass + salt).digest('hex');
}

/**
 * Verifies if the provided token matches the expected session token.
 */
export function isValidSessionToken(token: string | null | undefined): boolean {
  if (!token) return false;
  
  const expectedToken = generateSessionToken();
  return safeEqual(token, expectedToken);
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) {
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}
