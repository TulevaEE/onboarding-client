import { PaymentChannel } from '../../../common/apiModels';

export type AvailablePaymentType = 'SINGLE' | 'RECURRING';

export const bankKeyToBankNameMap = {
  swedbank: 'Swedbank',
  seb: 'SEB',
  lhv: 'LHV',
  luminor: 'Luminor',
  coop: 'Coop Pank',
  wise: 'Wise',
  citadele: 'Citadele',
  revolut: 'Revolut',
  bigbank: 'Bigbank',
  n26: 'N26',
} as const;

export type BankKey = keyof typeof bankKeyToBankNameMap;

export const BANK_KEYS = Object.keys(bankKeyToBankNameMap) as BankKey[];

const BANKS_WITH_STANDING_ORDER_LINK = [
  'swedbank',
  'seb',
  'lhv',
  'luminor',
  'coop',
  'wise',
] as const;

export type BankWithStandingOrderLink = (typeof BANKS_WITH_STANDING_ORDER_LINK)[number];

export const hasStandingOrderLink = (bank: BankKey | 'other'): bank is BankWithStandingOrderLink =>
  BANKS_WITH_STANDING_ORDER_LINK.some((linkedBank) => linkedBank === bank);

const PAYMENT_CHANNEL_BY_BANK: Record<BankKey, PaymentChannel> = {
  swedbank: 'SWEDBANK',
  seb: 'SEB',
  lhv: 'LHV',
  luminor: 'LUMINOR',
  coop: 'COOP',
  wise: 'WISE',
  citadele: 'CITADELE',
  revolut: 'REVOLUT',
  bigbank: 'BIGBANK',
  n26: 'N26',
};

export const paymentChannelFor = (bank: BankKey | 'other' | null): PaymentChannel | undefined =>
  bank && bank !== 'other' ? PAYMENT_CHANNEL_BY_BANK[bank] : undefined;
