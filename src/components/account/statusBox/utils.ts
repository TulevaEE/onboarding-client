import moment from 'moment';
import { FundPensionStatus } from '../../common/apiModels/withdrawals';
import { formatMonth } from '../../common/dateFormatter';

export const getFundPensionEndFormatted = (
  fundPension: FundPensionStatus['fundPensions'][number],
) => {
  const startDate = moment(fundPension.startDate);

  return formatMonth(startDate.add(fundPension.durationYears, 'years').toISOString());
};
