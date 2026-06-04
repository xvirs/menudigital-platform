import type { APIRoute } from 'astro';
import { AUTH_COOKIE_NAME, generateSessionToken } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    const data = await request.formData();
    const username = data.get('username')?.toString();
    const password = data.get('password')?.toString();

    const expectedUser = import.meta.env.ADMIN_USER || 'admin';
    const expectedPass = import.meta.env.ADMIN_PASS;

    if (expectedPass && username === expectedUser && password === expectedPass) {
      const token = generateSessionToken();
      
      cookies.set(AUTH_COOKIE_NAME, token, {
        path: '/',
        httpOnly: true,
        secure: import.meta.env.PROD, // secure true on production
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      return redirect('/admin');
    }

    return redirect('/admin/login?error=credentials');
  } catch (error) {
    return redirect('/admin/login?error=credentials');
  }
};
