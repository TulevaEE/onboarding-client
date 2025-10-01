import { SavingsFundPaymentApplication } from '../../common/apiModels';

export const transfer2Pillar = {
  id: 1234,
  type: 'TRANSFER',
  status: 'PENDING',
  creationTime: new Date('December 17, 1995 03:24:00').toISOString(),
  details: {
    cancellationDeadline: '3000-01-01T23:59:59.999999999Z',
    sourceFund: {
      fundManager: { name: 'Tuleva' },
      isin: 'EE3600109435',
      name: 'Tuleva Maailma Aktsiate Pensionifond',
      managementFeeRate: 0.0034,
      pillar: 2,
      ongoingChargesFigure: 0.0042,
    },
    exchanges: [
      {
        targetFund: {
          fundManager: { name: 'Swedbank' },
          isin: 'EE3600109443',
          name: 'Swedbank I',
          managementFeeRate: 0.0034,
          pillar: 2,
          ongoingChargesFigure: 0.0046,
        },
        amount: 0.01,
      },
      {
        targetFund: {
          fundManager: { name: 'Swedbank' },
          isin: 'EE3600109442',
          name: 'Swedbank II',
          managementFeeRate: 0.0034,
          pillar: 2,
          ongoingChargesFigure: 0.0046,
        },
        amount: 0.025,
      },
    ],
  },
};

export const transferPIK = {
  id: 1234,
  type: 'TRANSFER',
  status: 'PENDING',
  creationTime: new Date('December 17, 1995 03:24:00').toISOString(),
  details: {
    cancellationDeadline: '3000-01-01T23:59:59.999999999Z',
    sourceFund: {
      fundManager: { name: 'Tuleva' },
      isin: 'EE3600109435',
      name: 'Tuleva Maailma Aktsiate Pensionifond',
      managementFeeRate: 0.0034,
      pillar: 2,
      ongoingChargesFigure: 0.0042,
    },
    exchanges: [
      {
        targetPik: 'EE356001123409443',
        amount: 1,
      },
    ],
  },
};

export const transfer3Pillar = {
  id: 3832579,
  type: 'TRANSFER',
  status: 'PENDING',
  creationTime: '2021-08-01T14:00:00Z',
  details: {
    sourceFund: {
      fundManager: { name: 'Swedbank' },
      isin: 'EE3600071049',
      name: 'Swedbank Pensionifond V3 (Aktsiastrateegia)',
      managementFeeRate: 0.014,
      pillar: 3,
      ongoingChargesFigure: 0.0175,
      status: 'ACTIVE',
    },
    exchanges: [
      {
        sourceFund: {
          fundManager: { name: 'Swedbank' },
          isin: 'EE3600071049',
          name: 'Swedbank Pensionifond V3 (Aktsiastrateegia)',
          managementFeeRate: 0.014,
          pillar: 3,
          ongoingChargesFigure: 0.0175,
          status: 'ACTIVE',
        },
        targetFund: {
          fundManager: { name: 'Tuleva' },
          isin: 'EE3600001707',
          name: 'Tuleva III Samba Pensionifond',
          managementFeeRate: 0.003,
          pillar: 3,
          ongoingChargesFigure: 0.0049,
          status: 'ACTIVE',
        },
        amount: 1310.247,
      },
    ],
    cancellationDeadline: '2021-11-30T21:59:59.999999999Z',
    fulfillmentDate: '2022-01-03',
  },
};

export const earlyWithdrawal = {
  id: 123,
  type: 'EARLY_WITHDRAWAL',
  status: 'PENDING',
  creationTime: new Date('December 17, 1995 03:24:00').toISOString(),
  details: {
    cancellationDeadline: '3000-01-01T23:59:59.999999999Z',
    fulfillmentDate: new Date('January 2, 1995 03:24:00').toISOString(),
    depositAccountIBAN: 'EE123123123',
  },
};

export const withdrawal = {
  id: 123,
  type: 'WITHDRAWAL',
  status: 'PENDING',
  creationTime: new Date('December 17, 1995 03:24:00').toISOString(),
  details: {
    cancellationDeadline: '3000-01-01T23:59:59.999999999Z',
    fulfillmentDate: new Date('January 2, 1995 03:24:00').toISOString(),
    depositAccountIBAN: 'EE123123123',
  },
};

export const stopContributions = {
  id: 123,
  type: 'STOP_CONTRIBUTIONS',
  status: 'PENDING',
  creationTime: new Date('December 17, 1995 03:24:00').toISOString(),
  details: {
    cancellationDeadline: '3000-01-01T23:59:59.999999999Z',
    stopTime: new Date('December 18, 1995 03:24:00').toISOString(),
    earliestResumeTime: new Date('December 19, 1995 03:24:00').toISOString(),
  },
};

export const resumeContributions = {
  id: 123,
  type: 'RESUME_CONTRIBUTIONS',
  status: 'PENDING',
  creationTime: new Date('December 17, 1995 03:24:00').toISOString(),
  details: {
    cancellationDeadline: '3000-01-01T23:59:59.999999999Z',
    resumeTime: new Date('December 18, 1995 03:24:00').toISOString(),
  },
};

export const savingFundPaymentApplication: SavingsFundPaymentApplication = {
  id: 321,
  type: 'SAVING_FUND_PAYMENT',
  status: 'PENDING',
  creationTime: '2024-01-15T10:30:00.000Z',
  details: {
    amount: 250.99,
    currency: 'EUR',
    cancellationDeadline: '2024-02-15T23:59:59.999999999Z',
    fulfillmentDeadline: '2024-02-01',
  },
};

export const payment = {
  id: 15,
  type: 'PAYMENT',
  status: 'PENDING',
  creationTime: '2022-10-04T13:22:24.215230Z',
  details: {
    amount: 12.34,
    currency: 'EUR',
    targetFund: {
      fundManager: {
        name: 'Tuleva',
      },
      isin: 'EE3600001707',
      name: 'Tuleva III Samba Pensionifond',
      managementFeeRate: 0.0023,
      pillar: 3,
      ongoingChargesFigure: 0.0035,
      status: 'ACTIVE',
    },
  },
};

export const fundPensionOpening = {
  id: 16,
  type: 'FUND_PENSION_OPENING',
  status: 'PENDING',
  creationTime: '2022-10-04T13:22:24.215230Z',
  details: {
    cancellationDeadline: '3000-01-01T23:59:59.999999999Z',
    fulfillmentDate: new Date('January 2, 2024 03:24:00').toISOString(),
    depositAccountIBAN: 'EE123123123',
    fundPensionDetails: {
      durationYears: 20,
      paymentsPerYear: 12,
    },
  },
};

export const thirdPillarFundPensionOpening = {
  id: 17,
  type: 'FUND_PENSION_OPENING_THIRD_PILLAR',
  status: 'PENDING',
  creationTime: '2022-10-04T13:22:24.215230Z',
  details: {
    cancellationDeadline: '3000-01-01T23:59:59.999999999Z',
    fulfillmentDate: new Date('January 2, 2024 03:24:00').toISOString(),
    depositAccountIBAN: 'EE123123123',
    fundPensionDetails: {
      durationYears: 20,
      paymentsPerYear: 12,
    },
  },
};

export const partialWithdrawal = {
  id: 18,
  type: 'PARTIAL_WITHDRAWAL',
  status: 'PENDING',
  creationTime: new Date('December 17, 1995 03:24:00').toISOString(),
  details: {
    cancellationDeadline: '3000-01-01T23:59:59.999999999Z',
    fulfillmentDate: new Date('January 2, 2024 03:24:00').toISOString(),
    depositAccountIBAN: 'EE123123123',
  },
};

export const thirdPillarWithdrawal = {
  id: 19,
  type: 'WITHDRAWAL_THIRD_PILLAR',
  status: 'PENDING',
  creationTime: new Date('December 17, 1995 03:24:00').toISOString(),
  details: {
    cancellationDeadline: '3000-01-01T23:59:59.999999999Z',
    fulfillmentDate: new Date('January 2, 2024 03:24:00').toISOString(),
    depositAccountIBAN: 'EE123123123',
  },
};

export const paymentRateChange = {
  id: 654,
  type: 'PAYMENT_RATE',
  status: 'PENDING',
  creationTime: '2024-10-04T13:22:24.215230Z',
  details: {
    paymentRate: 6,
    cancellationDeadline: '2024-11-30T23:59:59.999999999Z',
    fulfillmentDate: '2025-01-01',
  },
};
