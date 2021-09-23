import { SourceFund } from '../../common/apiModels';

export const incompleteConversion = {
  secondPillar: {
    selectionComplete: false,
    transfersComplete: false,
    paymentComplete: false,
    pendingWithdrawal: false,
    contribution: { yearToDate: 200, total: 250 },
    subtraction: { yearToDate: 0, total: 0 },
  },
  thirdPillar: {
    selectionComplete: false,
    transfersComplete: false,
    paymentComplete: false,
    pendingWithdrawal: false,
    contribution: { yearToDate: 300, total: 450 },
    subtraction: { yearToDate: 0, total: 0 },
  },
};

export const completeConversion = {
  secondPillar: {
    selectionComplete: true,
    transfersComplete: true,
    paymentComplete: true,
    pendingWithdrawal: false,
    contribution: { yearToDate: 560, total: 20600 },
    subtraction: { yearToDate: 0, total: 0 },
  },
  thirdPillar: {
    selectionComplete: true,
    transfersComplete: true,
    paymentComplete: true,
    pendingWithdrawal: false,
    contribution: { yearToDate: 2500, total: 37000 },
    subtraction: { yearToDate: 0, total: 0 },
  },
};

export const completeThirdPillarconversion = {
  secondPillar: {
    selectionComplete: false,
    transfersComplete: false,
    paymentComplete: false,
    pendingWithdrawal: false,
    contribution: { yearToDate: 560, total: 20600 },
    subtraction: { yearToDate: 0, total: 0 },
  },
  thirdPillar: {
    selectionComplete: true,
    transfersComplete: true,
    paymentComplete: true,
    pendingWithdrawal: false,
    contribution: { yearToDate: 2500, total: 37000 },
    subtraction: { yearToDate: 0, total: 0 },
  },
};

export const completeSecondPillarconversion = {
  secondPillar: {
    selectionComplete: true,
    transfersComplete: true,
    paymentComplete: true,
    pendingWithdrawal: false,
    contribution: { yearToDate: 2500, total: 37000 },
    subtraction: { yearToDate: 0, total: 0 },
  },
  thirdPillar: {
    selectionComplete: false,
    transfersComplete: false,
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
