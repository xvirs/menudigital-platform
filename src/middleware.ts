import { defineMiddleware } from 'astro:middleware';
import { AUTH_COOKIE_NAME, isValidSessionToken } from './lib/auth';

const PROTECTED_PREFIXES = ['/admin', '/api/admin'];
const PUBLIC_PREFIXES = ['/admin/login', '/api/admin/login'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  
  const isPublic = PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected || isPublic) {
    return next();
  }

  const sessionCookie = context.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!isValidSessionToken(sessionCookie)) {
    // Redirect to login page if not authenticated
    return context.redirect('/admin/login');
  }

  return next();
});
