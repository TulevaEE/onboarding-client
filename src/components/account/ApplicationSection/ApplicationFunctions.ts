import moment from 'moment/moment';
import { Application } from '../../common/apiModels';

export const isBeforeCancellationDeadline = (application: Application): boolean =>
  moment().isSameOrBefore(
    moment(
      (
        application.details as {
          cancellationDeadline: string;
        }
      ).cancellationDeadline,
    ),
    'day',
  );
