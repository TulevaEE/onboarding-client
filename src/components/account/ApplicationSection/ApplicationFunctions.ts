import moment from 'moment/moment';
import { Application, RejoinApplication } from '../../common/apiModels';

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

export const isRejoinApplication = (application: Application): application is RejoinApplication =>
  application.type === 'REJOIN';
