import { FormattedMessage } from 'react-intl';
import { formatMonthEnd } from '../../common/dateFormatter';

export const RejoinDisclaimers = ({
  cancellationDeadline,
  className = '',
}: {
  cancellationDeadline: string;
  className?: string;
}) => (
  <div role="note" className={className}>
    <p className="mb-1">
      <FormattedMessage id="secondPillarRejoin.restriction.summary" />
    </p>
    <p className="mb-0">
      <FormattedMessage
        id="secondPillarRejoin.restriction.cancellation"
        values={{ month: formatMonthEnd(cancellationDeadline) }}
      />
    </p>
  </div>
);
