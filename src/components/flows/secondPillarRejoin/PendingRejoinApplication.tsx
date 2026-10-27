import { FormattedMessage } from 'react-intl';
import { RejoinApplication } from '../../common/apiModels';
import { dayInTallinn, formatDateYear } from '../../common/dateFormatter';
import { ApplicationCard } from '../../account/ApplicationSection/ApplicationCards';
import { isDateSameOrBeforeCancellationDeadline } from '../../account/ApplicationSection/ApplicationFunctions';

export const PendingRejoinApplication = ({ application }: { application: RejoinApplication }) => (
  <>
    <h1 className="mb-4 text-balance">
      <FormattedMessage id="secondPillarRejoin.pending.heading" />
    </h1>
    <ApplicationCard application={application} allowedActions={['CANCEL']} />
    {isDateSameOrBeforeCancellationDeadline(application) && (
      <p className="mt-4 mb-0 text-pretty">
        <FormattedMessage
          id="secondPillarRejoin.pending.cancellation"
          values={{
            deadline: formatDateYear(dayInTallinn(application.details.cancellationDeadline)),
          }}
        />
      </p>
    )}
  </>
);
