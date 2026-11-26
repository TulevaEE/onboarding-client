import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useCompletedApplications, usePendingApplications } from '../../../common/apiHooks';
import { PaymentRateApplication } from '../../../common/apiModels';
import { formatDateFromWithYear } from '../../../common/dateFormatter';
import { Shimmer } from '../../../common/shimmer/Shimmer';
import { isPaymentRateApplication } from '../../ApplicationSection/ApplicationFunctions';

const filedLast = (first: PaymentRateApplication, second: PaymentRateApplication) =>
  new Date(second.creationTime).getTime() - new Date(first.creationTime).getTime();

type PaymentRates = {
  currentPaymentRate: number;
  pendingPaymentRate: number;
};

export type PaymentRateChange =
  | { state: 'NONE' }
  | { state: 'LOADING' }
  | { state: 'DATED'; fulfillmentDate: string }
  | { state: 'UNDATED' };

export const usePaymentRateChange = ({
  currentPaymentRate,
  pendingPaymentRate,
}: PaymentRates): PaymentRateChange => {
  const pending = usePendingApplications();
  const realised = useCompletedApplications();

  if (pendingPaymentRate === currentPaymentRate) {
    return { state: 'NONE' };
  }
  if (pending.isInitialLoading || realised.isInitialLoading) {
    return { state: 'LOADING' };
  }

  const [applicationForThePendingRate] = [...(pending.data ?? []), ...(realised.data ?? [])]
    .filter(isPaymentRateApplication)
    .filter((application) => application.details.paymentRate === pendingPaymentRate)
    .sort(filedLast);
  return applicationForThePendingRate
    ? { state: 'DATED', fulfillmentDate: applicationForThePendingRate.details.fulfillmentDate }
    : { state: 'UNDATED' };
};

export const CurrentPaymentRate = ({ currentPaymentRate }: { currentPaymentRate: number }) => (
  <FormattedMessage id="account.status.choice.paymentRate" values={{ currentPaymentRate }} />
);

export const PaymentRateSubRow = ({ currentPaymentRate, pendingPaymentRate }: PaymentRates) => {
  const change = usePaymentRateChange({ currentPaymentRate, pendingPaymentRate });
  const rates = { currentPaymentRate, futurePaymentRate: pendingPaymentRate };

  switch (change.state) {
    case 'DATED':
      return (
        <FormattedMessage
          id="account.status.choice.futurePaymentRate"
          values={{
            ...rates,
            paymentRateFulfillmentDate: formatDateFromWithYear(change.fulfillmentDate),
          }}
        />
      );
    case 'UNDATED':
      return (
        <FormattedMessage id="account.status.choice.futurePaymentRate.withoutDate" values={rates} />
      );
    case 'LOADING':
      return <Shimmer height={24} />;
    default:
      return <CurrentPaymentRate currentPaymentRate={currentPaymentRate} />;
  }
};
