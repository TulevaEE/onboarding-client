import moment from 'moment/moment';
import { Application, PaymentRateApplication, RejoinApplication } from '../../common/apiModels';

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

export const isPaymentRateApplication = (
  application: Application,
): application is PaymentRateApplication => application.type === 'PAYMENT_RATE';
