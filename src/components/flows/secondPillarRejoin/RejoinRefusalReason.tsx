import { FormattedMessage } from 'react-intl';
import { formatDateFromWithYear, todayInTallinn } from '../../common/dateFormatter';
import { NoStopApplicationMessage } from '../../common/errorMessage/NoStopApplicationMessage';

const isAfterToday = (day: string) => day > todayInTallinn();

export const RejoinRefusalReason = ({
  contributionsEndedWithoutApplication,
  rejoinPossibleFrom,
}: {
  contributionsEndedWithoutApplication: boolean;
  rejoinPossibleFrom: string | null | undefined;
}) => {
  if (contributionsEndedWithoutApplication) {
    return <NoStopApplicationMessage />;
  }
  if (rejoinPossibleFrom && isAfterToday(rejoinPossibleFrom)) {
    return (
      <FormattedMessage
        id="account.status.choice.pillar.second.notContributing.line2.rejoinPossibleFrom"
        values={{ date: formatDateFromWithYear(rejoinPossibleFrom) }}
      />
    );
  }
  return <FormattedMessage id="secondPillarRejoin.notPermitted" />;
};
