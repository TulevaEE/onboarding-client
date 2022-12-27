import { SourceFund, UserConversion } from '../../common/apiModels';

export const incompleteConversion: UserConversion = {
  secondPillar: {
    selectionComplete: false,
    selectionPartial: false,
    transfersComplete: false,
    transfersPartial: false,
    paymentComplete: false,
    pendingWithdrawal: false,
    contribution: { yearToDate: 200, total: 250 },
    subtraction: { yearToDate: 0, total: 0 },
  },
  thirdPillar: {
    selectionComplete: false,
    selectionPartial: false,
    transfersComplete: false,
    transfersPartial: false,
    paymentComplete: false,
    pendingWithdrawal: false,
    contribution: { yearToDate: 300, total: 450 },
    subtraction: { yearToDate: 0, total: 0 },
  },
};

export const completeConversion: UserConversion = {
  secondPillar: {
    selectionComplete: true,
    selectionPartial: true,
    transfersComplete: true,
    transfersPartial: true,
    paymentComplete: true,
    pendingWithdrawal: false,
    contribution: { yearToDate: 560, total: 20600 },
    subtraction: { yearToDate: 0, total: 0 },
  },
  thirdPillar: {
    selectionComplete: true,
    selectionPartial: true,
    transfersComplete: true,
    transfersPartial: true,
    paymentComplete: true,
    pendingWithdrawal: false,
    contribution: { yearToDate: 2500, total: 37000 },
    subtraction: { yearToDate: 0, total: 0 },
  },
};

export const completeThirdPillarConversion: UserConversion = {
  secondPillar: {
    selectionComplete: false,
    selectionPartial: false,
    transfersComplete: false,
    transfersPartial: false,
    paymentComplete: false,
    pendingWithdrawal: false,
    contribution: { yearToDate: 560, total: 20600 },
    subtraction: { yearToDate: 0, total: 0 },
  },
  thirdPillar: {
    selectionComplete: true,
    selectionPartial: true,
    transfersComplete: true,
    transfersPartial: true,
    paymentComplete: true,
    pendingWithdrawal: false,
    contribution: { yearToDate: 2500, total: 37000 },
    subtraction: { yearToDate: 0, total: 0 },
  },
};

export const completeSecondPillarConversion: UserConversion = {
  secondPillar: {
    selectionComplete: true,
    selectionPartial: true,
    transfersComplete: true,
    transfersPartial: true,
    paymentComplete: true,
    pendingWithdrawal: false,
    contribution: { yearToDate: 2500, total: 37000 },
    subtraction: { yearToDate: 0, total: 0 },
  },
  thirdPillar: {
    selectionComplete: false,
    selectionPartial: false,
    transfersComplete: false,
    transfersPartial: false,
    paymentComplete: false,
    pendingWithdrawal: false,
    contribution: { yearToDate: 560, total: 20600 },
    subtraction: { yearToDate: 0, total: 0 },
  },
};

export const activeSecondPillar: SourceFund = {
  activeFund: true,
  name: 'Tuleva III Samba Pensionifond',
  fundManager: { name: 'Tuleva' },
  pillar: 3,
  managementFeePercent: '0.003',
  isin: 'EE3600001707',
  price: 23,
  unavailablePrice: 0,
  currency: 'EUR',
  ongoingChargesFigure: 0.0049,
  contributions: 500,
  subtractions: 0,
  profit: 500,
};

export const activeThirdPillar: SourceFund = {
  activeFund: true,
  name: 'Tuleva III Samba Pensionifond',
  fundManager: { name: 'Tuleva' },
  pillar: 3,
  managementFeePercent: '0.003',
  isin: 'EE3600001707',
  price: 23,
  unavailablePrice: 0,
  currency: 'EUR',
  ongoingChargesFigure: 0.0049,
  contributions: 500,
  subtractions: 0,
  profit: 500,
};
