import { SourceFund } from '../../apiModels';

const savingsFund: SourceFund = {
  isin: 'EE0000003283',
  name: 'Tuleva Täiendav Kogumisfond',
  fundManager: { name: 'Tuleva' },
  pillar: null,
  managementFeePercent: 0.29,
  ongoingChargesFigure: 0.0029,
  activeFund: false,
  price: 0,
  unavailablePrice: 0,
  currency: 'EUR',
  contributions: 0,
  subtractions: 0,
  profit: 0,
  units: 0,
};

export const savingsFundBalanceProfiles: Record<string, SourceFund | null> = {
  ZERO_BALANCE: savingsFund,
  WITH_BALANCE: {
    ...savingsFund,
    price: 5000,
    contributions: 4500,
    profit: 500,
    units: 4464,
  },
  NO_ACCOUNT: null,
};
