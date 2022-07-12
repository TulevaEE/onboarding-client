import { ApplicationStatus, ApplicationType } from '../../common/apiModels';

export const transfer2Pillar = {
  id: 1234,
  type: ApplicationType.TRANSFER,
  status: ApplicationStatus.PENDING,
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
  type: ApplicationType.TRANSFER,
  status: ApplicationStatus.PENDING,
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
  creationTime: '2021-08-01T14:00:00Z',
  type: 'TRANSFER',
  status: 'PENDING',
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
  type: ApplicationType.EARLY_WITHDRAWAL,
  status: ApplicationStatus.PENDING,
  creationTime: new Date('December 17, 1995 03:24:00').toISOString(),
  details: {
    cancellationDeadline: '3000-01-01T23:59:59.999999999Z',
    fulfillmentDate: new Date('January 2, 1995 03:24:00').toISOString(),
    depositAccountIBAN: 'EE123123123',
  },
};

export const withdrawal = {
  id: 123,
  type: ApplicationType.WITHDRAWAL,
  status: ApplicationStatus.PENDING,
  creationTime: new Date('December 17, 1995 03:24:00').toISOString(),
  details: {
    cancellationDeadline: '3000-01-01T23:59:59.999999999Z',
    fulfillmentDate: new Date('January 2, 1995 03:24:00').toISOString(),
    depositAccountIBAN: 'EE123123123',
  },
};

export const stopContributions = {
  id: 123,
  type: ApplicationType.STOP_CONTRIBUTIONS,
  status: ApplicationStatus.PENDING,
  creationTime: new Date('December 17, 1995 03:24:00').toISOString(),
  details: {
    cancellationDeadline: '3000-01-01T23:59:59.999999999Z',
    stopTime: new Date('December 18, 1995 03:24:00').toISOString(),
    earliestResumeTime: new Date('December 19, 1995 03:24:00').toISOString(),
  },
};

export const resumeContributions = {
  id: 123,
  type: ApplicationType.RESUME_CONTRIBUTIONS,
  status: ApplicationStatus.PENDING,
  creationTime: new Date('December 17, 1995 03:24:00').toISOString(),
  details: {
    cancellationDeadline: '3000-01-01T23:59:59.999999999Z',
    resumeTime: new Date('December 18, 1995 03:24:00').toISOString(),
  },
};
