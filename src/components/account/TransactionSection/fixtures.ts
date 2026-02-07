import { Transaction } from '../../common/apiModels';

export const contribution: Transaction = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  amount: 313.57,
  currency: 'EUR',
  time: '2023-01-23T15:12:58Z',
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
  isin: 'EE3600001707',
  type: 'SUBTRACTION',
  units: 10.0,
  nav: 10.0,
};
