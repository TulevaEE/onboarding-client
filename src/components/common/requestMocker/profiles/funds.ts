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

const pensionFunds: Fund[] = [
  {
    isin: 'EE3600109435',
    name: 'Tuleva Maailma Aktsiate Pensionifond',
    nav: 0.87831,
    pillar: 2,
    managementFeeRate: 0.0034,
    ongoingChargesFigure: 0.0039,
    fundManager: { name: 'Tuleva' },
    status: 'ACTIVE',
    inceptionDate: '2017-03-28',
  },
  {
    isin: 'EE3600109443',
    name: 'Tuleva Maailma Võlakirjade Pensionifond',
    nav: 0.59311,
    pillar: 2,
    managementFeeRate: 0.0027,
    ongoingChargesFigure: 0.0039,
    fundManager: { name: 'Tuleva' },
    status: 'ACTIVE',
    inceptionDate: '2017-03-28',
  },
  {
    isin: 'EE3600019758',
    name: 'Swedbank Pensionifond K60',
    nav: 1.46726,
    pillar: 2,
    managementFeeRate: 0.0083,
    ongoingChargesFigure: 0.0065,
    fundManager: { name: 'Swedbank' },
    status: 'ACTIVE',
    inceptionDate: '2002-05-02',
  },
  {
    isin: 'EE3600001707',
    name: 'Tuleva III Samba Pensionifond',
    nav: 0.7813,
    pillar: 3,
    managementFeeRate: 0.003,
    ongoingChargesFigure: 0.0043,
    fundManager: { name: 'Tuleva' },
    status: 'ACTIVE',
    inceptionDate: '2017-10-02',
  },
  {
    isin: 'EE3600010294',
    name: 'LHV Pensionifond Aktiivne III',
    nav: 2.34419,
    pillar: 3,
    managementFeeRate: 0.009,
    ongoingChargesFigure: 0.0113,
    fundManager: { name: 'LHV' },
    status: 'ACTIVE',
    inceptionDate: '2002-04-15',
  },
];

export const fundsProfiles: Record<string, Fund[]> = {
  WITH_SAVINGS_FUND: [...pensionFunds, savingsFund],
  WITHOUT_SAVINGS_FUND: pensionFunds,
};
