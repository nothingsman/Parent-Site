import 'server-only';

export type Locale = 'en' | 'am';
export const locales: Locale[] = ['en', 'am'];
export const defaultLocale: Locale = 'en';

export function hasLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

const dictionaries = {
  en: () => import('./en.json').then((module) => module.default),
  am: () => import('./am.json').then((module) => module.default),
};

export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale]?.() ?? dictionaries.en();
};
