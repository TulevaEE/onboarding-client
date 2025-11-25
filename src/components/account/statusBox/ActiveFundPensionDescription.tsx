import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { FundPension } from '../../common/apiModels/withdrawals';
import { formatMonth } from '../../common/dateFormatter';

export const ActiveFundPensionDescription = ({ fundPension }: { fundPension: FundPension }) => (
  <span className="text-body-secondary">
    <FormattedMessage
      id="account.status.choice.fundPension.description"
      values={{
        endDate: getFundPensionEndFormatted(fundPension),
        b: (chunks: string) => <b>{chunks}</b>,
      }}
    />
  </span>
);

const getFundPensionEndFormatted = (fundPension: FundPension) => {
  const startDate = moment(fundPension.startDate);

  return formatMonth(startDate.add(fundPension.durationYears, 'years').toISOString());
};
