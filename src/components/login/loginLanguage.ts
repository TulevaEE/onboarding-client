import { useIntl } from 'react-intl';

const SMART_ID_LANGUAGES = ['et', 'en', 'ru'];
const DEFAULT_LOGIN_LANGUAGE = 'et';

export function useLoginLanguage(): string {
  const { locale } = useIntl();
  return SMART_ID_LANGUAGES.includes(locale) ? locale : DEFAULT_LOGIN_LANGUAGE;
}
