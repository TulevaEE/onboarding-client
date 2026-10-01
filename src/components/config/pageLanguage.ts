import { smartIdCallbackPath } from '../login/constants';

const PAGE_LANGUAGES = ['et', 'en'];
const DEFAULT_PAGE_LANGUAGE = 'et';

const offered = (language: string | null): string | null =>
  language && PAGE_LANGUAGES.includes(language) ? language : null;

export const pageLanguage = (
  { pathname, search }: { pathname: string; search: string },
  pendingLoginLanguage: () => string | null,
): string => {
  const inAddress = offered(new URLSearchParams(search).get('language'));
  const continuingSmartIdLogin = pathname.startsWith(smartIdCallbackPath);
  return (
    inAddress ??
    (continuingSmartIdLogin ? offered(pendingLoginLanguage()) : null) ??
    DEFAULT_PAGE_LANGUAGE
  );
};
