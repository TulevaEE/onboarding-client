import { TranslationKey } from '../../translations';
import {
  INSURANCE_TRANSFER_FORM_INSURERS,
  InsuranceTransferFormInsurer,
} from '../../common/apiModels/insurance-transfer';

export const INSURER_CODES = ['SWEDBANK', 'SEB', 'COMPENSA', 'ARTEA', 'ERGO'] as const;

export type InsurerCode = (typeof INSURER_CODES)[number];

export type GuidedInsurerCode = Exclude<InsurerCode, InsuranceTransferFormInsurer>;

type Insurer = {
  name: string;
  formerNamesMessageId?: TranslationKey;
  eServiceUrl: string;
};

type GuideStep = {
  messageId: TranslationKey;
  showsPensionAccountNumber?: boolean;
};

type Guide = {
  actionUrl: string;
  writesLetter: boolean;
  steps: GuideStep[];
};

export const insurers: Record<InsurerCode, Insurer> = {
  SWEDBANK: { name: 'Swedbank', eServiceUrl: 'https://www.swedbank.ee/private' },
  SEB: { name: 'SEB', eServiceUrl: 'https://e.seb.ee/ib/p/pensionDashboard' },
  COMPENSA: { name: 'Compensa', eServiceUrl: 'https://www.compensalife.eu/EE/logon.asp?lngID=et' },
  ARTEA: {
    name: 'Artea',
    formerNamesMessageId: 'insuranceTransfer.insurer.ARTEA.formerNames',
    eServiceUrl: 'https://e-life.artea.ee',
  },
  ERGO: { name: 'Ergo', eServiceUrl: 'https://ekontor.ergo.ee/lepingud' },
};

export const guides: Record<GuidedInsurerCode, Guide> = {
  SEB: {
    actionUrl: 'https://e.seb.ee/ib/p/frame/messages',
    writesLetter: true,
    steps: [
      { messageId: 'insuranceTransfer.guide.SEB.openMessage' },
      { messageId: 'insuranceTransfer.guide.SEB.send' },
    ],
  },
  SWEDBANK: {
    actionUrl:
      'https://www.swedbank.ee/private/pensions/my/pensionAssets/insuranceContract/modification/termination',
    writesLetter: false,
    steps: [
      { messageId: 'insuranceTransfer.guide.SWEDBANK.logIn' },
      { messageId: 'insuranceTransfer.guide.SWEDBANK.chooseFund' },
      {
        messageId: 'insuranceTransfer.guide.SWEDBANK.pensionAccount',
        showsPensionAccountNumber: true,
      },
      { messageId: 'insuranceTransfer.guide.SWEDBANK.confirm' },
    ],
  },
};

export const takesSignedForm = (code: InsurerCode): code is InsuranceTransferFormInsurer =>
  INSURANCE_TRANSFER_FORM_INSURERS.some((formInsurer) => formInsurer === code);

export const toInsurerCode = (value: string | null): InsurerCode | null =>
  INSURER_CODES.find((code) => code === value) ?? null;
