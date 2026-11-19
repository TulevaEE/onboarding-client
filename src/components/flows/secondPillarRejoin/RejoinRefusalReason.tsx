import { FormattedMessage } from 'react-intl';
import { RejoinDecision } from '../../common/apiModels';
import { formatDateFromWithYear, todayInTallinn } from '../../common/dateFormatter';
import { NoStopApplicationMessage } from '../../common/errorMessage/NoStopApplicationMessage';

export const dateToWaitForRejoining = (
  rejoinPossibleFrom: string | null | undefined,
  decision: RejoinDecision | undefined,
): string | null =>
  decision === 'REFUSED_BY_PENSIONIKESKUS' &&
  rejoinPossibleFrom &&
  rejoinPossibleFrom > todayInTallinn()
    ? rejoinPossibleFrom
    : null;

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
  const waitUntil = dateToWaitForRejoining(rejoinPossibleFrom, decision);
  if (waitUntil) {
    return (
      <FormattedMessage
        id="account.status.choice.pillar.second.notContributing.line2.rejoinPossibleFrom"
        values={{ date: formatDateFromWithYear(waitUntil) }}
      />
    );
  }
  return <FormattedMessage id="secondPillarRejoin.notPermitted" />;
};
