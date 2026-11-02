import { captureException } from '@sentry/browser';
import { useQuery } from '@tanstack/react-query';
import { useIntl } from 'react-intl';
import { TranslationKey } from '../../../translations';

type TkfDocumentLink = { href: string; labelId: TranslationKey };

type FundPageFields = Record<string, unknown>;

const FUND_DOCUMENTS_PAGE_SLUG = 'tuleva-taiendav-kogumisfond-dokumendid';
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

export const TKF_DOCUMENTS_IN_FORCE_COUNT = DOCUMENTS_IN_FORCE.length;

const documentUrl = (value: unknown): string | null =>
  typeof value === 'string' && value.startsWith('https://tuleva.ee/') ? value : null;

const toTkfDocumentLinks = (
  fields: FundPageFields,
  lastReadFailed: boolean,
  fundDocumentsPageLink: TkfDocumentLink,
): TkfDocumentLink[] => {
  const links = DOCUMENTS_IN_FORCE.flatMap(({ field, labelId }) => {
    const href = documentUrl(fields[field]);
    return href ? [{ href, labelId }] : [];
  });
  const lacksADocument = links.length < DOCUMENTS_IN_FORCE.length;

  return lacksADocument || lastReadFailed ? [...links, fundDocumentsPageLink] : links;
};

class FundPageRefusal extends Error {
  constructor(readonly status: number) {
    super(`Fund page fields request failed with status ${status}`);
  }
}

const reportFallback = (reason: string) => {
  const message = `TKF100 document links fell back to the documents page: reason=${reason}`;
  captureException(new Error(message), { fingerprint: [message] });
};

const reasonTheReadFailed = (error: unknown, timedOut: boolean): string => {
  if (timedOut) {
    return 'timeout';
  }
  if (error instanceof FundPageRefusal) {
    return `http-${error.status}`;
  }
  return error instanceof SyntaxError ? 'unreadable-answer' : 'network';
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
      throw new FundPageRefusal(response.status);
    }
    const pages: { acf?: unknown }[] = await response.json();
    const fields = pages[0]?.acf;
    return fields && typeof fields === 'object' ? (fields as FundPageFields) : {};
  } catch (error) {
    reportFallback(reasonTheReadFailed(error, timeout.signal.aborted));
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

const getFundPageFieldsReportingMissingDocuments = async (): Promise<FundPageFields> => {
  const fields = await getFundPageFields();
  const missingFields = DOCUMENTS_IN_FORCE.map(({ field }) => field).filter(
    (field) => !documentUrl(fields[field]),
  );
  if (missingFields.length > 0) {
    reportFallback(`missing:${missingFields.join(',')}`);
  }
  return fields;
};

export const useTkfDocuments = (): TkfDocumentLink[] | undefined => {
  const { formatMessage } = useIntl();
  const { data, isError, errorUpdateCount } = useQuery({
    queryKey: ['tkfDocuments'],
    queryFn: getFundPageFieldsReportingMissingDocuments,
    retry: false,
    networkMode: 'always',
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  const hasNeverAnswered = !data && errorUpdateCount === 0;
  if (hasNeverAnswered) {
    return undefined;
  }
  const fundDocumentsPageLink: TkfDocumentLink = {
    href: formatMessage({ id: 'flows.savingsFundOnboarding.termsStep.linkHref.allDocuments' }),
    labelId: 'flows.savingsFundOnboarding.termsStep.linkText.allDocuments',
  };
  return toTkfDocumentLinks(data ?? {}, isError, fundDocumentsPageLink);
};
