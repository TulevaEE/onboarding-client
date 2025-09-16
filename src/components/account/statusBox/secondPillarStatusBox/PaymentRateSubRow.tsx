import React from 'react';
import { FormattedMessage } from 'react-intl';
import { formatDateYear } from '../../../common/dateFormatter';

export const PaymentRateSubRow = ({
  currentPaymentRate,
  futurePaymentRate,
  paymentRateFulfillmentDate,
}: {
  currentPaymentRate: number;
  futurePaymentRate: number;
  paymentRateFulfillmentDate: string;
}) => {
  if (currentPaymentRate !== futurePaymentRate) {
    const currentMonth = new Date().getMonth();
    const isDecember = currentMonth === 11;

    return isDecember ? (
      <FormattedMessage
        id="account.status.choice.futurePaymentRate.withDate"
        values={{
          currentPaymentRate,
          futurePaymentRate,
          paymentRateFulfillmentDate: formatDateYear(paymentRateFulfillmentDate),
        }}
      />
    ) : (
      <FormattedMessage
        id="account.status.choice.futurePaymentRate"
        values={{
          currentPaymentRate,
          futurePaymentRate,
        }}
      />
    );
  }

  return (
    <FormattedMessage
      id="account.status.choice.paymentRate"
      values={{
        currentPaymentRate,
      }}
    />
  );
};
