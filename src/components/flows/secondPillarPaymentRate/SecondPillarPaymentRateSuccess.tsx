import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useLocation } from 'react-router-dom';
import { Location } from 'history';
import config from 'react-global-configuration';
import { SuccessNotice } from '../common/SuccessNotice/SuccessNotice';
import { useMandateDeadlines } from '../../common/apiHooks';
import { formatDateYear } from '../../common/dateFormatter';
import { Nudge } from '../../common/nudge/Nudge';

export const SecondPillarPaymentRateSuccess: React.FC = () => {
  const location: Location<{ fulfillmentDate: string; paymentRate: number; isDecreased: boolean }> =
    useLocation();
  const { paymentRate, isDecreased } = location.state || {};
  const { data: mandateDeadlines } = useMandateDeadlines();

  return (
    <>
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
        <p className="mt-5 mb-0">
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
              paymentRateDeadline: formatDateYear(mandateDeadlines?.paymentRateDeadline) || '...',
              b: (chunks: string) => <b>{chunks}</b>,
            }}
          />
        </p>

        <a
          className="btn btn-primary mt-5"
          href={`/account${config.get('language') === 'en' ? '?language=en' : ''}`}
        >
          <FormattedMessage id="secondPillarPaymentRateSuccess.accountLink" />
        </a>
      </SuccessNotice>
      <Nudge context="SECOND_PILLAR_PAYMENT_RATE" />
    </>
  );
};
