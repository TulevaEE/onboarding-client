import { useQuery } from '@tanstack/react-query';
import { TranslationKey } from '../../../translations';

type TkfDocumentLink = { href: string; labelId: TranslationKey };

type FundPageFields = Record<string, unknown>;

const FUND_DOCUMENTS_PAGE_SLUG = 'tuleva-taiendav-kogumisfond-dokumendid';
const FUND_DOCUMENTS_PAGE_URL = `https://tuleva.ee/${FUND_DOCUMENTS_PAGE_SLUG}/`;
const FUND_PAGE_TIMEOUT_MS = 5000;
const FUND_PAGE_FIELDS_URL = `https://tuleva.ee/wp-json/wp/v2/pages?slug=${FUND_DOCUMENTS_PAGE_SLUG}&_fields=acf&acf_format=standard`;

const DOCUMENTS_IN_FORCE: { field: string; labelId: TranslationKey }[] = [
  { field: 'terms_file', labelId: 'flows.savingsFundOnboarding.termsStep.linkText.terms' },
  {
    field: 'prospectus_file',
    labelId: 'flows.savingsFundOnboarding.termsStep.linkText.prospectus',
  },
  {
    field: 'key_investor_info_file',
    labelId: 'flows.savingsFundOnboarding.termsStep.linkText.keyInfo',
  },
];

const FUND_DOCUMENTS_PAGE_LINK: TkfDocumentLink = {
  href: FUND_DOCUMENTS_PAGE_URL,
  labelId: 'flows.savingsFundOnboarding.termsStep.linkText.allDocuments',
};

const documentUrl = (value: unknown): string | null =>
  typeof value === 'string' && value.startsWith('https://tuleva.ee/') ? value : null;

const toTkfDocumentLinks = (fields: FundPageFields, lastReadFailed: boolean): TkfDocumentLink[] => {
  const links = DOCUMENTS_IN_FORCE.flatMap(({ field, labelId }) => {
    const href = documentUrl(fields[field]);
    return href ? [{ href, labelId }] : [];
  });
  const lacksADocument = links.length < DOCUMENTS_IN_FORCE.length;

  return lacksADocument || lastReadFailed ? [...links, FUND_DOCUMENTS_PAGE_LINK] : links;
};

const getFundPageFields = async (): Promise<FundPageFields> => {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), FUND_PAGE_TIMEOUT_MS);
  try {
    const response = await fetch(FUND_PAGE_FIELDS_URL, {
      credentials: 'omit',
      signal: timeout.signal,
    });
    if (!response.ok) {
      throw new Error(`Fund page fields request failed with status ${response.status}`);
    }
    const pages: { acf?: unknown }[] = await response.json();
    const fields = pages[0]?.acf;
    return fields && typeof fields === 'object' ? (fields as FundPageFields) : {};
  } finally {
    clearTimeout(timer);
  }
};

export const useTkfDocuments = (): TkfDocumentLink[] | undefined => {
  const { data, isError, errorUpdateCount } = useQuery({
    queryKey: ['tkfDocuments'],
    queryFn: getFundPageFields,
    retry: false,
    networkMode: 'always',
  });

  const hasNeverAnswered = !data && errorUpdateCount === 0;
  if (hasNeverAnswered) {
    return undefined;
  }
  return toTkfDocumentLinks(data ?? {}, isError);
};
