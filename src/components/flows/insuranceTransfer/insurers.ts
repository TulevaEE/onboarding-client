import { TranslationKey } from '../../translations';
import {
  INSURANCE_TRANSFER_FORM_INSURERS,
  InsuranceTransferFormInsurer,
} from '../../common/apiModels/insurance-transfer';

export const INSURER_CODES = ['SEB', 'COMPENSA', 'SWEDBANK', 'ARTEA', 'ERGO'] as const;

export type InsurerCode = (typeof INSURER_CODES)[number];

export type GuidedInsurerCode = Exclude<InsurerCode, InsuranceTransferFormInsurer>;

type Insurer = {
  name: string;
  formerNamesMessageId?: TranslationKey;
};

type Guide = {
  actionUrl: string;
  stepMessageIds: TranslationKey[];
};

export const insurers: Record<InsurerCode, Insurer> = {
  SEB: { name: 'SEB' },
  COMPENSA: { name: 'Compensa' },
  SWEDBANK: { name: 'Swedbank' },
  ARTEA: { name: 'Artea', formerNamesMessageId: 'insuranceTransfer.insurer.ARTEA.formerNames' },
  ERGO: { name: 'Ergo' },
};

export const guides: Record<GuidedInsurerCode, Guide> = {
  SEB: {
    actionUrl: 'https://e.seb.ee/ib/p/frame/messages',
    stepMessageIds: ['insuranceTransfer.guide.SEB.openMessage', 'insuranceTransfer.guide.SEB.send'],
  },
  SWEDBANK: {
    actionUrl: 'https://www.swedbank.ee/private/home/important/communication/messages/send',
    stepMessageIds: [
      'insuranceTransfer.guide.SWEDBANK.openMessage',
      'insuranceTransfer.guide.SWEDBANK.send',
    ],
  },
};

export const takesSignedForm = (code: InsurerCode): code is InsuranceTransferFormInsurer =>
  INSURANCE_TRANSFER_FORM_INSURERS.some((formInsurer) => formInsurer === code);

export const toInsurerCode = (value: string | null): InsurerCode | null =>
  INSURER_CODES.find((code) => code === value) ?? null;
