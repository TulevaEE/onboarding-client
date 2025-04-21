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
      contributions: 50,
      profit: 10,
      value: 60,
      currency: 'EUR',
    },
    {
      type: 'WORK_COMPENSATION',
      contributions: 10000,
      profit: 2000,
      value: 12000,
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
  ONLY_MEMBERSHIP: [
    {
      type: 'MEMBERSHIP_BONUS',
      contributions: 50,
      profit: 10,
      value: 60,
      currency: 'EUR',
    },
  ],
};
