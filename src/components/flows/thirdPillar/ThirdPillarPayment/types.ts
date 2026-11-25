import { PaymentChannel } from '../../../common/apiModels';

export type AvailablePaymentType = 'SINGLE' | 'RECURRING';

export const bankKeyToBankNameMap = {
  swedbank: 'Swedbank',
  seb: 'SEB',
  lhv: 'LHV',
  luminor: 'Luminor',
  coop: 'Coop Pank',
  revolut: 'Revolut',
  wise: 'Wise',
  citadele: 'Citadele',
  bigbank: 'Bigbank',
  n26: 'N26',
} as const;

export type BankKey = keyof typeof bankKeyToBankNameMap;

export const BANK_KEYS = Object.keys(bankKeyToBankNameMap) as BankKey[];

export const ESTONIAN_BANK_KEYS: BankKey[] = ['swedbank', 'seb', 'lhv', 'luminor', 'coop'];

export const OTHER_BANK_KEYS = BANK_KEYS.filter((bank) => !ESTONIAN_BANK_KEYS.includes(bank));

const BANKS_WITH_STANDING_ORDER_LINK = [
  'swedbank',
  'seb',
  'lhv',
  'luminor',
  'coop',
  'wise',
  'citadele',
  'bigbank',
] as const;

const BANKS_WHERE_STANDING_ORDER_DETAILS_ARE_TYPED_IN = [
  'luminor',
  'wise',
  'citadele',
  'bigbank',
] as const;

export const standingOrderDetailsAreTypedIn = (bank: BankKey | 'other' | null): boolean =>
  BANKS_WHERE_STANDING_ORDER_DETAILS_ARE_TYPED_IN.some((typedInBank) => typedInBank === bank);

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
