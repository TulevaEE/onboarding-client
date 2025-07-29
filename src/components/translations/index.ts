import et from './translations.et.json';
import en from './translations.en.json';

export default { et, en };

export type TranslationKey = keyof typeof et & keyof typeof en;

export function isTranslationKey(key: string): key is TranslationKey {
  return key in et && key in en;
}
