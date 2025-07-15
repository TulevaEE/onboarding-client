import { CapitalRow } from '../../apiModels';

export const memberCapitalProfiles: Record<string, CapitalRow[]> = {
  ALL_TYPES: [
    {
      type: 'CAPITAL_PAYMENT',
      contributions: 1000,
      profit: 200,
      value: 1200,
      currency: 'EUR',
      unitCount: 1000,
      unitPrice: 1.2,
    },
    {
      type: 'MEMBERSHIP_BONUS',
      contributions: 50,
      profit: 10,
      value: 60,
      currency: 'EUR',
      unitCount: 50,
      unitPrice: 1.2,
    },
    {
      type: 'WORK_COMPENSATION',
      contributions: 10000,
      profit: 2000,
      value: 12000,
      currency: 'EUR',
      unitCount: 10000,
      unitPrice: 1.2,
    },
    {
      type: 'UNVESTED_WORK_COMPENSATION',
      contributions: 1000,
      profit: 200,
      value: 1200,
      currency: 'EUR',
      unitCount: 1000,
      unitPrice: 1.2,
    },
  ],
  ONLY_MEMBERSHIP: [
    {
      type: 'MEMBERSHIP_BONUS',
      contributions: 50,
      profit: 10,
      value: 60,
      currency: 'EUR',
      unitCount: 50,
      unitPrice: 1.2,
    },
  ],
};
