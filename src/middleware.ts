import { defineMiddleware } from 'astro:middleware';
import { isAuthorized, unauthorizedResponse } from './lib/auth';

const PROTECTED_PREFIXES = ['/admin', '/api/admin'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const needsAuth = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!needsAuth) return next();

  if (!isAuthorized(context.request)) return unauthorizedResponse();

  return next();
});
