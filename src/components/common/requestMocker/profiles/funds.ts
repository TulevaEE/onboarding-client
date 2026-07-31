import { Fund } from '../../apiModels';

const savingsFund: Fund = {
  isin: 'EE0000003283',
  name: 'Tuleva Täiendav Kogumisfond',
  nav: 1.2,
  pillar: null,
  managementFeeRate: 0.0028,
  ongoingChargesFigure: 0.0028,
  fundManager: { name: 'Tuleva' },
  status: 'ACTIVE',
  inceptionDate: '2024-01-02',
};

export const fundsProfiles: Record<string, Fund[]> = {
  SAVINGS_FUND_ONLY: [savingsFund],
  EMPTY: [],
};
