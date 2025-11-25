import { FundPensionStatus } from '../../apiModels/withdrawals';

export const fundPensionStatusProfiles: Record<string, FundPensionStatus> = {
  NO_FUND_PENSION: {
    fundPensions: [],
  },

  SECOND_PILLAR_FUND_PENSION: {
    fundPensions: [
      {
        pillar: 'SECOND',
        active: true,
        startDate: '2024-01-01',
        endDate: null,
        durationYears: 20,
      },
    ],
  },

  THIRD_PILLAR_FUND_PENSION: {
    fundPensions: [
      {
        pillar: 'THIRD',
        active: true,
        startDate: '2024-01-01',
        endDate: null,
        durationYears: 19,
      },
    ],
  },
};
