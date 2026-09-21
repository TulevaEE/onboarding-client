import { Transaction } from '../../common/apiModels';

export const contribution: Transaction = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  amount: 313.57,
  currency: 'EUR',
  time: '2023-01-23T15:12:58Z',
  navDate: '2023-01-20',
  priceCalculationDate: null,
  applicationTime: null,
  counterpartyIban: null,
  isin: 'EE3600109435',
  type: 'CONTRIBUTION_CASH',
  units: 31.357,
  nav: 10.0,
};

export const subtraction: Transaction = {
  id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  amount: -100.0,
  currency: 'EUR',
  time: '2023-01-24T16:20:55Z',
  navDate: '2023-01-23',
  priceCalculationDate: null,
  applicationTime: null,
  counterpartyIban: null,
  isin: 'EE3600001707',
  type: 'SUBTRACTION',
  units: 10.0,
  nav: 10.0,
};

export const transferIn: Transaction = {
  id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
  amount: 500.0,
  currency: 'EUR',
  time: '2026-03-10T12:00:00Z',
  navDate: '2026-03-09',
  priceCalculationDate: null,
  applicationTime: null,
  counterpartyIban: null,
  isin: 'EE0000003283',
  type: 'TRANSFER_IN',
  units: 100.0,
  nav: null,
  acquisitionCost: 420.0,
};

export const inheritance: Transaction = {
  ...transferIn,
  id: 'e5f6a7b8-c9d0-1234-ef12-345678901234',
  acquisitionCost: 0,
};

export const transferOut: Transaction = {
  id: 'd4e5f6a7-b8c9-0123-def1-234567890123',
  amount: -300.0,
  currency: 'EUR',
  time: '2026-03-11T12:00:00Z',
  navDate: '2026-03-10',
  priceCalculationDate: null,
  applicationTime: null,
  counterpartyIban: null,
  isin: 'EE0000003283',
  type: 'TRANSFER_OUT',
  units: 40.0,
  nav: null,
};
