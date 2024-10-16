import { PersonalDetailsStepState, PensionHoldings } from './types';
import { Fund, FundStatus, SourceFund } from '../../common/apiModels';
import { WithdrawalsEligibility } from '../../common/apiModels/withdrawals';

export const withdrawalEligibility: WithdrawalsEligibility = {
  hasReachedEarlyRetirementAge: true,
  recommendedDurationYears: 20,
  age: 60,
};

export const personalDetails: PersonalDetailsStepState = {
  bankAccountIban: 'EE34123',
  taxResidencyCode: 'EST',
};

export const pensionHoldings: PensionHoldings = {
  totalBothPillars: 5000,
  totalSecondPillar: 3000,
  totalThirdPillar: 2000,
};

export const TEST_NAVS = {
  TULEVA_WORLD_SECOND_PILLAR: 1.5,
  TULEVA_BOND_SECOND_PILLAR: 1,
  TULEVA_THIRD_PILLAR: 1,
  LHV_THIRD_PILLAR: 5,
};

export const funds: Fund[] = [
  {
    isin: 'EE3600109435',
    name: 'Tuleva Maailma Aktsiate Pensionifond',
    pillar: 2,
    managementFeeRate: 0.0034,
    ongoingChargesFigure: 0.0047,
    fundManager: { name: 'Tuleva' },
    status: FundStatus.ACTIVE,
    inceptionDate: '2017-01-01',
    nav: TEST_NAVS.TULEVA_WORLD_SECOND_PILLAR,
  },
  {
    isin: 'EE3600109443',
    name: 'Tuleva Maailma Võlakirjade Pensionifond',
    pillar: 2,
    managementFeeRate: 0.0039,
    ongoingChargesFigure: 0.0045,
    fundManager: { name: 'Tuleva' },
    status: FundStatus.ACTIVE,
    inceptionDate: '2019-01-01',
    nav: TEST_NAVS.TULEVA_BOND_SECOND_PILLAR,
  },
  {
    isin: 'EE3600001707',
    name: 'Tuleva III Samba Pensionifond',
    pillar: 3,
    managementFeeRate: 0.0039,
    ongoingChargesFigure: 0.0045,
    fundManager: { name: 'Tuleva' },
    status: FundStatus.ACTIVE,
    inceptionDate: '2019-01-01',
    nav: TEST_NAVS.TULEVA_THIRD_PILLAR,
  },
  {
    isin: 'EE3600010294',
    name: 'LHV Pensionifond Aktiivne III',
    pillar: 3,
    managementFeeRate: 0.0039,
    ongoingChargesFigure: 0.0045,
    fundManager: { name: 'Tuleva' },
    status: FundStatus.ACTIVE,
    inceptionDate: '2019-01-01',
    nav: TEST_NAVS.LHV_THIRD_PILLAR,
  },
];

export const secondPillarSourceFunds: SourceFund[] = [
  {
    isin: 'EE3600109435',
    price: 1500,
    unavailablePrice: 500,
    activeFund: false,
    currency: 'EUR',
    name: 'Tuleva Maailma Aktsiate Pensionifond',
    fundManager: { name: 'Tuleva' },
    managementFeePercent: 0.34,
    pillar: 2,
    ongoingChargesFigure: 0.0047,
    contributions: 1000,
    subtractions: 0,
    profit: 500,
  },
  {
    isin: 'EE3600109443',
    price: 800,
    unavailablePrice: 200,
    activeFund: true,
    currency: 'GBP',
    name: 'Tuleva Maailma Võlakirjade Pensionifond',
    fundManager: { name: 'Tuleva' },
    managementFeePercent: 0.39,
    pillar: 2,
    ongoingChargesFigure: 0.0045,
    contributions: 800,
    subtractions: 0,
    profit: 200,
  },
];

export const thirdPillarSourceFunds: SourceFund[] = [
  {
    isin: 'EE3600001707',
    price: 1000,
    unavailablePrice: 500,
    activeFund: false,
    currency: 'EUR',
    name: 'Tuleva III Samba Pensionifond',
    fundManager: { name: 'Tuleva' },
    managementFeePercent: 0.34,
    pillar: 2,
    ongoingChargesFigure: 0.0047,
    contributions: 1000,
    subtractions: 50,
    profit: 300,
  },
  {
    isin: 'EE3600010294',
    price: 400,
    unavailablePrice: 100,
    activeFund: false,
    currency: 'EUR',
    name: 'LHV Pensionifond Aktiivne III',
    fundManager: { name: 'LHV' },
    managementFeePercent: 0.36,
    pillar: 2,
    ongoingChargesFigure: 0.0047,
    contributions: 400,
    subtractions: 0,
    profit: 100,
  },
];
