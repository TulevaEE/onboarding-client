import { SourceFund } from '../../apiModels';

const secondPillarFund: SourceFund = {
  isin: 'EE3600109435',
  name: 'Tuleva Maailma Aktsiate Pensionifond',
  fundManager: { name: 'Tuleva' },
  activeFund: true,
  pillar: 2,
  managementFeePercent: 0.34,
  price: 24586.29,
  unavailablePrice: 0,
  currency: 'EUR',
  ongoingChargesFigure: 0.0039,
  contributions: 19412.62,
  subtractions: 0,
  profit: 5173.67,
  units: 24586.29 / 0.87831,
};

const thirdPillarFund: SourceFund = {
  isin: 'EE3600001707',
  name: 'Tuleva III Samba Pensionifond',
  fundManager: { name: 'Tuleva' },
  activeFund: true,
  pillar: 3,
  managementFeePercent: 0.3,
  price: 8117.43,
  unavailablePrice: 0,
  currency: 'EUR',
  ongoingChargesFigure: 0.0043,
  contributions: 7248.91,
  subtractions: 0,
  profit: 868.52,
  units: 8117.43 / 0.7813,
};

export const sourceFundsProfiles: Record<string, SourceFund[]> = {
  BOTH_PILLARS: [secondPillarFund, thirdPillarFund],
  ONLY_SECOND_PILLAR: [secondPillarFund],
  ONLY_THIRD_PILLAR: [thirdPillarFund],
  NO_HOLDINGS: [],
};
