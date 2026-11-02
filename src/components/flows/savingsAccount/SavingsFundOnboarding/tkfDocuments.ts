import { captureException } from '@sentry/browser';
import { QueryFunctionContext, useQuery } from '@tanstack/react-query';
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

const missingDocumentFields = (fields: FundPageFields): string[] =>
  DOCUMENTS_IN_FORCE.map(({ field }) => field).filter((field) => !documentUrl(fields[field]));

const toTkfDocumentLinks = (
  fields: FundPageFields,
  lastReadFailed: boolean,
  fundDocumentsPageLink: TkfDocumentLink,
): TkfDocumentLink[] => {
  const links = DOCUMENTS_IN_FORCE.flatMap(({ field, labelId }) => {
    const href = documentUrl(fields[field]);
    return href ? [{ href, labelId }] : [];
  });
  const lacksADocument = missingDocumentFields(fields).length > 0;

  return lacksADocument || lastReadFailed ? [...links, fundDocumentsPageLink] : links;
};

type FallbackReason =
  | 'timeout'
  | 'network'
  | 'unreadable-answer'
  | 'no-page'
  | 'no-fields'
  | `http-${number}`
  | `missing:${string}`;

class FundPageReadFailure extends Error {
  constructor(readonly reason: FallbackReason) {
    super(`Fund page fields could not be read: ${reason}`);
  }
}

const reportFallback = (reason: FallbackReason) => {
  const message = `TKF100 document links fell back to the documents page: reason=${reason}`;
  captureException(new Error(message), { fingerprint: [message] });
};

const reasonTheReadFailed = (error: unknown, timedOut: boolean): FallbackReason => {
  if (timedOut) {
    return 'timeout';
  }
  if (error instanceof FundPageReadFailure) {
    return error.reason;
  }
  return error instanceof SyntaxError ? 'unreadable-answer' : 'network';
};

const fieldsOfTheFundPage = (pages: unknown): FundPageFields => {
  if (!Array.isArray(pages)) {
    throw new FundPageReadFailure('unreadable-answer');
  }
  if (pages.length === 0) {
    throw new FundPageReadFailure('no-page');
  }
  const fields = pages[0]?.acf;
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
    throw new FundPageReadFailure('no-fields');
  }
  return fields as FundPageFields;
};

const readFundPageFields = async (
  cancelled: AbortSignal | undefined,
  reportUnlessCancelled: (reason: FallbackReason) => void,
): Promise<FundPageFields> => {
  const reading = new AbortController();
  const stopReading = () => reading.abort();
  const timer = setTimeout(stopReading, FUND_PAGE_TIMEOUT_MS);
  cancelled?.addEventListener('abort', stopReading);
  try {
    const response = await fetch(FUND_PAGE_FIELDS_URL, {
      credentials: 'omit',
      signal: reading.signal,
    });
    if (!response.ok) {
      throw new FundPageReadFailure(`http-${response.status}`);
    }
    return fieldsOfTheFundPage(await response.json());
  } catch (error) {
    reportUnlessCancelled(reasonTheReadFailed(error, reading.signal.aborted));
    throw error;
  } finally {
    clearTimeout(timer);
    cancelled?.removeEventListener('abort', stopReading);
  }
};

const getFundPageFields = async ({ signal }: QueryFunctionContext): Promise<FundPageFields> => {
  const reportUnlessCancelled = (reason: FallbackReason) => {
    if (!signal?.aborted) {
      reportFallback(reason);
    }
  };
  const fields = await readFundPageFields(signal, reportUnlessCancelled);
  const missingFields = missingDocumentFields(fields);
  if (missingFields.length > 0) {
    reportUnlessCancelled(`missing:${missingFields.join(',')}`);
  }
  return fields;
};

export const useTkfDocuments = (): TkfDocumentLink[] | undefined => {
  const { formatMessage } = useIntl();
  const { data, isError, errorUpdateCount } = useQuery({
    queryKey: ['tkfDocuments'],
    queryFn: getFundPageFields,
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
