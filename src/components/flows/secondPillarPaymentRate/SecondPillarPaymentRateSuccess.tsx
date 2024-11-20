import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useLocation } from 'react-router-dom';
import { Location } from 'history';
import { SuccessNotice } from '../common/SuccessNotice/SuccessNotice';
import { useMandateDeadlines } from '../../common/apiHooks';
import { formatDateYear } from '../../common/dateFormatter';

export const SecondPillarPaymentRateSuccess: React.FC = () => {
  const location: Location<{ fulfillmentDate: string; paymentRate: number }> = useLocation();
  const { paymentRate } = location.state || {};
  const { data: mandateDeadlines } = useMandateDeadlines();

  return (
    <div className="row mt-5">
      <div className="col-12 px-0">
        <SuccessNotice>
          <h2 className="text-center mt-3">
            <FormattedMessage id="secondPillarPaymentRateSuccess.title" />
          </h2>
          <p className="m-0 mt-5">
            <FormattedMessage
              id="secondPillarPaymentRateSuccess.descriptionNewRate"
              values={{
                paymentRateFulfillmentDate:
                  formatDateYear(mandateDeadlines?.paymentRateFulfillmentDate) || '...',
                paymentRate: paymentRate || '...',
                b: (chunks: string) => <b>{chunks}</b>,
              }}
            />
          </p>
          <p className="m-0">
            <FormattedMessage id="secondPillarPaymentRateSuccess.descriptionEmployer" />
          </p>
          <a className="btn btn-primary mt-5 profile-link" href="/account">
            <FormattedMessage id="secondPillarPaymentRateSuccess.accountLink" />
          </a>
        </SuccessNotice>
      </div>
    </div>
  );
};
