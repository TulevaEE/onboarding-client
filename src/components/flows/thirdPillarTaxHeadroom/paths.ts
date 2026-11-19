export const TAX_HEADROOM_PATH = '/3rd-pillar-tax-headroom';
export const TAX_HEADROOM_RESULT_PATH = `${TAX_HEADROOM_PATH}/result`;

const PAYMENT_PATH = '/3rd-pillar-payment';

export type PrefilledPayment = { amount: number };

export const paymentLocationFor = (amount: number) => ({
  pathname: PAYMENT_PATH,
  state: { amount },
});

export const recurringPaymentLocationFor = (amount: number) => ({
  pathname: PAYMENT_PATH,
  search: '?type=RECURRING',
  state: { amount },
});
