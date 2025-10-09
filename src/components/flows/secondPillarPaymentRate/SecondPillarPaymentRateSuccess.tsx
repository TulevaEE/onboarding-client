import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useLocation } from 'react-router-dom';
import { Location } from 'history';
import { SuccessNotice } from '../common/SuccessNotice/SuccessNotice';
import { useMandateDeadlines } from '../../common/apiHooks';
import { formatDateYear } from '../../common/dateFormatter';

export const SecondPillarPaymentRateSuccess: React.FC = () => {
  const location: Location<{ fulfillmentDate: string; paymentRate: number; isDecreased: boolean }> =
    useLocation();
  const { paymentRate, isDecreased } = location.state || {};
  const { data: mandateDeadlines } = useMandateDeadlines();

  return (
    <SuccessNotice>
      <h2 className="text-center mt-3">
        <FormattedMessage
          id={
            isDecreased
              ? 'secondPillarPaymentRateSuccess.title.decrease'
              : 'secondPillarPaymentRateSuccess.title.increase'
          }
        />
      </h2>
      <p className="m-0 mt-5">
        <FormattedMessage
          id={
            isDecreased
              ? 'secondPillarPaymentRateSuccess.descriptionNewRate.decrease'
              : 'secondPillarPaymentRateSuccess.descriptionNewRate.increase'
          }
          values={{
            paymentRateFulfillmentDate:
              formatDateYear(mandateDeadlines?.paymentRateFulfillmentDate) || '...',
            paymentRate: paymentRate || '...',
            b: (chunks: string) => <b>{chunks}</b>,
          }}
        />
      </p>
      <p className="m-0">
        <FormattedMessage
          id={
            isDecreased
              ? 'secondPillarPaymentRateSuccess.descriptionEmployer.decrease'
              : 'secondPillarPaymentRateSuccess.descriptionEmployer.increase'
          }
          values={{
            paymentRateDeadline: formatDateYear(mandateDeadlines?.paymentRateDeadline) || '...',
            b: (chunks: string) => <b>{chunks}</b>,
          }}
        />
      </p>
      <a className="btn btn-primary mt-5 profile-link" href="/account">
        <FormattedMessage id="secondPillarPaymentRateSuccess.accountLink" />
      </a>
    </SuccessNotice>
  );
};
