import {LANGUAGE_IDS} from './languages'

type LocalizedValue = {language?: string; value?: string}

export function missingLanguages(value: LocalizedValue[] | undefined): string[] {
  const filled = new Set(
    (value ?? [])
      .filter((v) => typeof v.value === 'string' && v.value.trim() !== '')
      .map((v) => v.language),
  )
  return LANGUAGE_IDS.filter((id) => !filled.has(id))
}

/** `true` when every language has a non-empty value, otherwise a message naming the gaps. */
export function allLanguages(value: LocalizedValue[] | undefined): true | string {
  const missing = missingLanguages(value)
  return missing.length === 0 || `Missing: ${missing.join(', ')}`
}
