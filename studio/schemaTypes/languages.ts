// Ids must equal `Lang` in src/app/i18n.ts: the storefront passes its current
// language straight into the lookup.
export const LANGUAGES = [
  {id: 'en', title: 'English'},
  {id: 'ja', title: '日本語'},
  {id: 'fr', title: 'Français'},
  {id: 'zh', title: '简体中文'},
  {id: 'zh-TW', title: '繁體中文'},
] as const

export type LanguageId = (typeof LANGUAGES)[number]['id']

export const LANGUAGE_IDS: LanguageId[] = LANGUAGES.map((l) => l.id)
