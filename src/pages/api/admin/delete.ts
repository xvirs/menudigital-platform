import type { APIRoute } from 'astro';
import { deleteRestaurant } from '../../../lib/github';

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const slug = (form.get('slug') ?? '').toString().trim();

  if (!slug) {
    return redirect(`/admin?kind=err&msg=${encodeURIComponent('Falta slug')}`, 303);
  }

  try {
    await deleteRestaurant(slug, `chore(admin): delete ${slug}`);
    return redirect(`/admin?kind=ok&msg=${encodeURIComponent(`${slug} eliminado`)}`, 303);
  } catch (err: any) {
    const msg = err?.message ?? 'Error desconocido';
    return redirect(`/admin?kind=err&msg=${encodeURIComponent(msg)}`, 303);
  }
};
