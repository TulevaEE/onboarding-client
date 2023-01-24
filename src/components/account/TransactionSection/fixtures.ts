import { Transaction } from '../../common/apiModels';

export const contribution: Transaction = {
  amount: 313.57,
  currency: 'EUR',
  time: '2023-01-23T15:12:58Z',
  isin: 'EE3600109435',
};

export const subtraction: Transaction = {
  amount: -100.0,
  currency: 'EUR',
  time: '2023-01-24T16:20:55Z',
  isin: 'EE3600001707',
};
