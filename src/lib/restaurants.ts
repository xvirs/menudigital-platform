import type { Restaurant } from '../types/restaurant';

const modules = import.meta.glob<Restaurant>(
  '../../content/restaurants/*.json',
  { eager: true, import: 'default' }
);

const all: Restaurant[] = Object.values(modules);

export function getAllRestaurants(): Restaurant[] {
  return all;
}

export function getActiveRestaurants(): Restaurant[] {
  return all.filter((r) => r.status === 'active');
}

export function getRestaurantBySlug(slug: string): Restaurant | undefined {
  return all.find((r) => r.slug === slug && r.status === 'active');
}

export function getDish(restaurant: Restaurant, dishSlug: string) {
  return restaurant.items[dishSlug];
}

export function getSectionForDish(restaurant: Restaurant, dishSlug: string) {
  return restaurant.menuSections.find((s) => s.items.includes(dishSlug));
}

export function formatPrice(price: string): string {
  if (!/^\d+$/.test(price)) return price;
  return '$' + Number(price).toLocaleString('es-AR');
}
