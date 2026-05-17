import type { APIRoute } from 'astro';
import { getRestaurant, updateRestaurant } from '../../../lib/github';

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const slug = (form.get('slug') ?? '').toString().trim();
  const status = (form.get('status') ?? '').toString().trim();

  if (!slug || (status !== 'active' && status !== 'hidden')) {
    return redirect(`/admin?kind=err&msg=${encodeURIComponent('Parámetros inválidos para toggle')}`, 303);
  }

  try {
    const restaurant = await getRestaurant(slug);
    if (!restaurant) {
      return redirect(`/admin?kind=err&msg=${encodeURIComponent(`No existe ${slug}`)}`, 303);
    }

    const updated = {
      ...restaurant,
      status,
      version: restaurant.version + 1,
      updatedAt: new Date().toISOString(),
    };

    const verb = status === 'hidden' ? 'hide' : 'show';
    await updateRestaurant(slug, updated as typeof restaurant, `chore(admin): ${verb} ${slug}`);

    return redirect(`/admin?kind=ok&msg=${encodeURIComponent(`${slug}: ${status}`)}`, 303);
  } catch (err: any) {
    const msg = err?.message ?? 'Error desconocido';
    return redirect(`/admin?kind=err&msg=${encodeURIComponent(msg)}`, 303);
  }
};
