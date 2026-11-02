import { FormattedMessage } from 'react-intl';
import { RejoinDecision } from '../../common/apiModels';
import { formatDateFromWithYear, todayInTallinn } from '../../common/dateFormatter';
import { NoStopApplicationMessage } from '../../common/errorMessage/NoStopApplicationMessage';

const isAfterToday = (day: string) => day > todayInTallinn();

export const RejoinRefusalReason = ({
  decision,
  rejoinPossibleFrom,
}: {
  decision: RejoinDecision | undefined;
  rejoinPossibleFrom: string | null | undefined;
}) => {
  if (decision === 'CONTRIBUTIONS_CANNOT_RESTART') {
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
