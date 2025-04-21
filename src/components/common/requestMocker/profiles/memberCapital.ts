import { CapitalRow } from '../../apiModels';

export const memberCapitalProfiles: Record<string, CapitalRow[]> = {
  ALL_TYPES: [
    {
      type: 'CAPITAL_PAYMENT',
      contributions: 1000,
      profit: 200,
      value: 1200,
      currency: 'EUR',
    },
    {
      type: 'MEMBERSHIP_BONUS',
      contributions: 1000,
      profit: 200,
      value: 1200,
      currency: 'EUR',
    },
    {
      type: 'WORK_COMPENSATION',
      contributions: 1000,
      profit: 200,
      value: 1200,
      currency: 'EUR',
    },
    {
      type: 'UNVESTED_WORK_COMPENSATION',
      contributions: 1000,
      profit: 200,
      value: 1200,
      currency: 'EUR',
    },
  ],
};
