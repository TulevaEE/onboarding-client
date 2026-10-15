import { TranslationKey } from '../../translations';

export const INSURER_CODES = ['SEB', 'COMPENSA', 'SWEDBANK', 'ARTEA', 'ERGO'] as const;

export type InsurerCode = (typeof INSURER_CODES)[number];

type Insurer = {
  name: string;
  actionUrl: string;
  stepMessageIds: TranslationKey[];
  signedRequestEmail?: string;
};

export const insurers: Record<InsurerCode, Insurer> = {
  SEB: {
    name: 'SEB',
    actionUrl: 'https://e.seb.ee/ib/p/frame/messages',
    stepMessageIds: ['insuranceTransfer.guide.SEB.openMessage', 'insuranceTransfer.guide.SEB.send'],
  },
  COMPENSA: {
    name: 'Compensa',
    actionUrl: 'https://www.compensalife.ee',
    stepMessageIds: ['insuranceTransfer.guide.COMPENSA.send'],
    signedRequestEmail: 'info@compensalife.ee',
  },
  SWEDBANK: {
    name: 'Swedbank',
    actionUrl: 'https://www.swedbank.ee/private/home/important/communication/messages/send',
    stepMessageIds: [
      'insuranceTransfer.guide.SWEDBANK.openMessage',
      'insuranceTransfer.guide.SWEDBANK.send',
    ],
  },
  ARTEA: {
    name: 'Artea',
    actionUrl: 'https://e-life.artea.ee',
    stepMessageIds: ['insuranceTransfer.guide.ARTEA.send'],
    signedRequestEmail: 'kindlustus@artea.ee',
  },
  ERGO: {
    name: 'Ergo',
    actionUrl: 'https://ekontor.ergo.ee/lepingud',
    stepMessageIds: [
      'insuranceTransfer.guide.ERGO.openMessage',
      'insuranceTransfer.guide.ERGO.send',
    ],
  },
};

export const toInsurerCode = (value: string | null): InsurerCode | null =>
  INSURER_CODES.find((code) => code === value) ?? null;
