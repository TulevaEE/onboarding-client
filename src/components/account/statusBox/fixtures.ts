import { SourceFund, UserConversion } from '../../common/apiModels';

export const incompleteConversion: UserConversion = {
  secondPillar: {
    selectionComplete: false,
    selectionPartial: false,
    transfersComplete: false,
    transfersPartial: false,
    paymentComplete: false,
    pendingWithdrawal: false,
    contribution: { yearToDate: 200, lastYear: 40, total: 250 },
    subtraction: { yearToDate: 0, lastYear: 0, total: 0 },
  },
  thirdPillar: {
    selectionComplete: false,
    selectionPartial: false,
    transfersComplete: false,
    transfersPartial: false,
    paymentComplete: false,
    pendingWithdrawal: false,
    contribution: { yearToDate: 300, lastYear: 50, total: 450 },
    subtraction: { yearToDate: 0, lastYear: 0, total: 0 },
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
    contribution: { yearToDate: 560, lastYear: 100, total: 20600 },
    subtraction: { yearToDate: 0, lastYear: 0, total: 0 },
  },
  thirdPillar: {
    selectionComplete: true,
    selectionPartial: true,
    transfersComplete: true,
    transfersPartial: true,
    paymentComplete: true,
    pendingWithdrawal: false,
    contribution: { yearToDate: 2500, lastYear: 1000, total: 37000 },
    subtraction: { yearToDate: 0, lastYear: 0, total: 0 },
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
    contribution: { yearToDate: 560, lastYear: 100, total: 20600 },
    subtraction: { yearToDate: 0, lastYear: 0, total: 0 },
  },
  thirdPillar: {
    selectionComplete: true,
    selectionPartial: true,
    transfersComplete: true,
    transfersPartial: true,
    paymentComplete: true,
    pendingWithdrawal: false,
    contribution: { yearToDate: 2500, lastYear: 1000, total: 37000 },
    subtraction: { yearToDate: 0, lastYear: 0, total: 0 },
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
    contribution: { yearToDate: 2500, lastYear: 100, total: 37000 },
    subtraction: { yearToDate: 0, lastYear: 0, total: 0 },
  },
  thirdPillar: {
    selectionComplete: false,
    selectionPartial: false,
    transfersComplete: false,
    transfersPartial: false,
    paymentComplete: false,
    pendingWithdrawal: false,
    contribution: { yearToDate: 560, lastYear: 100, total: 20600 },
    subtraction: { yearToDate: 0, lastYear: 0, total: 0 },
  },
};

export const activeSecondPillar: SourceFund = {
  activeFund: true,
  name: 'Tuleva II Samba Pensionifond',
  fundManager: { name: 'Tuleva' },
  pillar: 2,
  managementFeePercent: 0.003,
  isin: 'EE000123',
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
  managementFeePercent: 0.003,
  isin: 'EE3600001707',
  price: 23,
  unavailablePrice: 0,
  currency: 'EUR',
  ongoingChargesFigure: 0.0049,
  contributions: 500,
  subtractions: 0,
  profit: 500,
};

export const highFeeThirdPillar: SourceFund = {
  activeFund: true,
  name: 'LHV High Cost Fund III',
  fundManager: { name: 'LHV' },
  pillar: 3,
  managementFeePercent: 0.015,
  isin: 'EE1234567',
  price: 23,
  unavailablePrice: 0,
  currency: 'EUR',
  ongoingChargesFigure: 0.0156,
  contributions: 500,
  subtractions: 0,
  profit: 500,
};

export const highFeeSecondPillar: SourceFund = {
  activeFund: true,
  name: 'LHV High Cost Fund II',
  fundManager: { name: 'LHV' },
  pillar: 2,
  managementFeePercent: 0.015,
  isin: 'EE432432',
  price: 23,
  unavailablePrice: 0,
  currency: 'EUR',
  ongoingChargesFigure: 0.0156,
  contributions: 500,
  subtractions: 0,
  profit: 500,
};
