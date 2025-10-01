import moment from 'moment/moment';
import { Application } from '../../common/apiModels';

type DetailsWithCancellationDeadline = {
  cancellationDeadline: string;
};

export const isDateSameOrBeforeCancellationDeadline = (application: Application): boolean =>
  moment().isSameOrBefore(
    moment((application.details as DetailsWithCancellationDeadline).cancellationDeadline),
    'day',
  );

export const isTimeBeforeCancellationDeadline = (application: Application): boolean =>
  moment().isBefore(
    moment((application.details as DetailsWithCancellationDeadline).cancellationDeadline),
    'minute',
  );
