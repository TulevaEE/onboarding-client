import { SAVINGS_FUND_DOCUMENTS } from './savingsFundDocuments';

export type SavingsFundDocumentType = 'terms' | 'prospectus' | 'keyInformation';

export type SavingsFundDocumentUrls = Record<SavingsFundDocumentType, string>;

const ACF_FIELD: Record<SavingsFundDocumentType, string> = {
  terms: 'terms_file',
  prospectus: 'prospectus_file',
  keyInformation: 'key_investor_info_file',
};

const TYPE_BY_LABEL: Record<string, SavingsFundDocumentType> = {
  'flows.savingsFundOnboarding.termsStep.linkText.terms': 'terms',
  'flows.savingsFundOnboarding.termsStep.linkText.prospectus': 'prospectus',
  'flows.savingsFundOnboarding.termsStep.linkText.keyInfo': 'keyInformation',
};

const DOCUMENT_TYPES: SavingsFundDocumentType[] = ['terms', 'prospectus', 'keyInformation'];

const DOCUMENTS_PAGE_ACF_URL =
  'https://tuleva.ee/wp-json/wp/v2/pages?slug=tuleva-taiendav-kogumisfond-dokumendid';

export const normalizeDocumentUrl = (url: string): string => {
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${parsed.pathname}`;
};

export const publishedDocumentsFromAcf = (
  acf: Record<string, unknown> | undefined,
): SavingsFundDocumentUrls => {
  const resolved: Partial<SavingsFundDocumentUrls> = {};
  const missing: string[] = [];

  DOCUMENT_TYPES.forEach((type) => {
    const field = ACF_FIELD[type];
    const value = acf ? acf[field] : undefined;
    if (typeof value === 'string' && value.length > 0) {
      resolved[type] = normalizeDocumentUrl(value);
    } else {
      missing.push(field);
    }
  });

  if (missing.length > 0) {
    throw new Error(`Savings fund document ACF fields missing or empty: [${missing.join(', ')}]`);
  }

  return resolved as SavingsFundDocumentUrls;
};

export const shippedDocuments = (): SavingsFundDocumentUrls => {
  const resolved: Partial<SavingsFundDocumentUrls> = {};

  SAVINGS_FUND_DOCUMENTS.forEach(({ href, labelId }) => {
    const type = TYPE_BY_LABEL[labelId];
    if (type) {
      resolved[type] = normalizeDocumentUrl(href);
    }
  });

  return resolved as SavingsFundDocumentUrls;
};

export const fetchPublishedDocuments = async (): Promise<SavingsFundDocumentUrls> => {
  const response = await fetch(DOCUMENTS_PAGE_ACF_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch savings fund documents page: HTTP ${response.status}`);
  }

  const pages = (await response.json()) as { acf?: Record<string, unknown> }[];
  if (!pages[0]) {
    throw new Error('Savings fund documents page not found');
  }

  return publishedDocumentsFromAcf(pages[0].acf);
};
