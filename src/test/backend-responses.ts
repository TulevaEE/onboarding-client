import moment from 'moment';
import {
  CancellationMandate,
  CapitalRow,
  Conversion,
  Fund,
  MandateDeadlines,
  MobileSignatureResponse,
  MobileSignatureStatusResponse,
  User,
} from '../components/common/apiModels';
import { SecondPillarPaymentRateChangeMandate } from '../components/flows/secondPillarPaymentRate/types';

export const authErrorResponse = {
  error: 'not authenticated correctly',
};

export const getMobileSignatureResponse = (
  challengeCode?: string | null,
): MobileSignatureResponse => ({
  challengeCode: challengeCode ?? '9876',
});

export const getMobileSignatureStatusResponse = (
  statusCode: 'SIGNATURE' | 'OUTSTANDING_TRANSACTION',
  challengeCode?: string | null,
): MobileSignatureStatusResponse => ({
  challengeCode: challengeCode ?? '9876',
  statusCode,
});

export const secondPillarPaymentRateChangeResponse: SecondPillarPaymentRateChangeMandate = {
  mandateId: 1,
};

export const cancellationResponse: CancellationMandate = {
  mandateId: 1,
};

export const mockUser: User = {
  id: 123,
  personalCode: '39001011234',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phoneNumber: '55667788',
  memberNumber: 987,
  memberJoinDate: '2019-04-01T06:46:55.000Z',
  pensionAccountNumber: '9876543210',
  address: {
    countryCode: 'EE',
  },
  secondPillarActive: true,
  thirdPillarActive: true,
  age: 30,
  secondPillarPaymentRates: {
    current: 2,
    pending: null,
  },
  secondPillarPikNumber: 'EE812233986174431932', // Swedbank PIK
  dateOfBirth: '1989-01-01',
  retirementAge: 60,
  secondPillarOpenDate: '2010-01-01',
  thirdPillarInitDate: '2019-01-01',
  contactDetailsLastUpdateDate: moment().format('YYYY-MM-DD'),
};

export const mockSecondPillarConversion: Conversion = {
  transfersComplete: true,
  selectionComplete: true,
  pendingWithdrawal: false,
  paymentComplete: false,
  contribution: { total: 12345.67, yearToDate: 111.11, lastYear: 100 },
  subtraction: { total: 0.0, yearToDate: 0.0, lastYear: 0 },
  selectionPartial: false,
  transfersPartial: false,
  weightedAverageFee: 0.034,
};

export const mockThirdPillarConversion: Conversion = {
  transfersComplete: true,
  selectionComplete: true,
  pendingWithdrawal: false,
  paymentComplete: true,
  contribution: { total: 9876.54, yearToDate: 999.99, lastYear: 100 },
  subtraction: { total: 0.0, yearToDate: 0.0, lastYear: 0 },
  selectionPartial: false,
  transfersPartial: false,
  weightedAverageFee: 0.034,
};

export const mockFunds: Fund[] = [
  {
    fundManager: { name: 'Tuleva' },
    isin: 'EE3600001707',
    name: 'Tuleva III Samba Pensionifond',
    managementFeeRate: 0.003,
    nav: 0.7813,
    pillar: 3,
    ongoingChargesFigure: 0.0043,
    status: 'ACTIVE',
    inceptionDate: moment().subtract(25, 'years').format(),
  },
  {
    fundManager: { name: 'Swedbank' },
    isin: 'EE3600019758',
    name: 'Swedbank Pension Fund K60',
    managementFeeRate: 0.0083,
    nav: 1.46726,
    pillar: 2,
    ongoingChargesFigure: 0.0065,
    status: 'ACTIVE',
    inceptionDate: moment().subtract(25, 'years').format(),
  },
  {
    fundManager: { name: 'Tuleva' },
    isin: 'EE3600109435',
    name: 'Tuleva World Stocks Pension Fund',
    managementFeeRate: 0.0034,
    nav: 0.87831,
    pillar: 2,
    ongoingChargesFigure: 0.0039,
    status: 'ACTIVE',
    inceptionDate: moment().subtract(2, 'years').format(),
  },
  {
    fundManager: { name: 'Tuleva' },
    isin: 'EE3600109443',
    name: 'Tuleva World Bonds Pension Fund',
    managementFeeRate: 0.0027,
    pillar: 2,
    ongoingChargesFigure: 0.0039,
    status: 'ACTIVE',
    nav: 0.59311,
    inceptionDate: moment().subtract(2, 'years').format(),
  },
  {
    fundManager: { name: 'Young' },
    isin: 'EE1000000000',
    name: 'Young Fund',
    managementFeeRate: 0.0027,
    pillar: 2,
    ongoingChargesFigure: 0.0039,
    status: 'ACTIVE',
    nav: 0.59311,
    inceptionDate: moment().subtract(2, 'years').format(),
  },
];

export const capitalRowsResponse: CapitalRow[] = [
  {
    type: 'CAPITAL_PAYMENT',
    contributions: 1000.0,
    profit: -123.45,
    value: 1000.0 - 123.45,
    currency: 'EUR',
    unitPrice: (1000 - 123.45) / 1000,
    unitCount: 1000,
  },
  {
    type: 'UNVESTED_WORK_COMPENSATION',
    contributions: 0,
    profit: 0,
    value: 0,
    currency: 'EUR',
    unitCount: 0,
    unitPrice: (1000 - 123.45) / 1000,
  },
  {
    type: 'WORK_COMPENSATION',
    contributions: 0,
    profit: 0,
    value: 0,
    unitCount: 0,
    unitPrice: 1.23,
    currency: 'EUR',
  },
  {
    type: 'MEMBERSHIP_BONUS',
    contributions: 1.23,
    profit: 0,
    value: 1.23,
    currency: 'EUR',
    unitPrice: 1.23,
    unitCount: 1,
  },
];

export const mandateDeadlinesResponse: MandateDeadlines = {
  periodEnding: '2024-03-31T20:59:59.999999999Z',
  paymentRateDeadline: '2024-11-30T21:59:59.999999999Z',
  earlyWithdrawalFulfillmentDate: '2024-09-02',
  transferMandateCancellationDeadline: '2024-03-31T20:59:59.999999999Z',
  withdrawalCancellationDeadline: '2023-12-31T21:59:59.999999999Z',
  earlyWithdrawalCancellationDeadline: '2024-07-31T20:59:59.999999999Z',
  transferMandateFulfillmentDate: '2024-05-01',
  withdrawalFulfillmentDate: '2024-01-16',
  paymentRateFulfillmentDate: '2025-01-01',
  withdrawalLatestFulfillmentDate: '2024-01-20',
  secondPillarContributionEndDate: '2024-08-01',
};
