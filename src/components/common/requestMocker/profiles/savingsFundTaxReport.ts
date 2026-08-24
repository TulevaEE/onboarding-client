import moment from 'moment';
import { SavingsFundTaxReport } from '../../apiModels';

const lastYear = moment().year() - 1;

export const savingsFundTaxReportProfiles: Record<string, SavingsFundTaxReport> = {
  ONE_REDEMPTION: {
    investmentAccount: null,
    year: lastYear,
    method: 'WEIGHTED_AVERAGE',
    totalGain: 58.96,
    redemptions: [
      {
        time: `${lastYear}-09-10T10:00:00Z`,
        units: 40,
        acquisitionCost: 421.04,
        proceeds: 480,
        gain: 58.96,
      },
    ],
  },
  LOSS: {
    investmentAccount: null,
    year: lastYear,
    method: 'WEIGHTED_AVERAGE',
    totalGain: -32.5,
    redemptions: [
      {
        time: `${lastYear}-11-02T10:00:00Z`,
        units: 25,
        acquisitionCost: 312.5,
        proceeds: 280,
        gain: -32.5,
      },
    ],
  },
  NOTHING_SOLD: {
    investmentAccount: null,
    year: lastYear,
    method: 'WEIGHTED_AVERAGE',
    totalGain: 0,
    redemptions: [],
  },
};
