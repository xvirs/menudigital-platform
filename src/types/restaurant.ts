export type HexColor = `#${string}`;

export interface Theme {
  primaryColor: HexColor;
  backgroundColor: HexColor;
  textColor: HexColor;
  accentColor: HexColor;
  fonts: {
    heading: string;
    body: string;
  };
}

export interface SocialInstagram {
  url: string;
  handle: string;
}

export interface SocialWhatsApp {
  number: string;
  message: string;
}

export interface RestaurantInfo {
  name: string;
  location?: string;
  subtitle?: string;
  since?: string;
  description?: string;
  schedule?: string;
  social?: {
    instagram?: SocialInstagram;
    whatsapp?: SocialWhatsApp;
  };
  theme: Theme;
}

export interface MenuSection {
  id: string;
  title: string;
  items: string[];
}

export interface MenuItem {
  slug: string;
  name: string;
  price: string;
  shortDescription?: string;
  description?: string;
  ingredients?: string[];
  type?: string;
  icon: string;
}

export interface RestaurantMeta {
  sourcePdfName: string;
  extractedBy: string;
  missingFields: string[];
}

export interface Restaurant {
  slug: string;
  status: 'active' | 'hidden';
  version: number;
  createdAt: string;
  updatedAt: string;
  _meta: RestaurantMeta;
  info: RestaurantInfo;
  menuSections: MenuSection[];
  items: Record<string, MenuItem>;
}

export const MISSING_VALUE_SENTINEL = '_dato no disponible_';

export function isMissing(value: string | undefined): boolean {
  return value === undefined || value === '' || value === MISSING_VALUE_SENTINEL;
}
