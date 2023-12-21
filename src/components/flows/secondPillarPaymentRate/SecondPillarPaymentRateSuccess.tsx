import React from 'react';
import { FormattedMessage } from 'react-intl';
import { SuccessNotice } from '../common/SuccessNotice/SuccessNotice';

export const SecondPillarPaymentRateSuccess: React.FC = () => (
  <div className="row mt-5">
    <div className="col-12 px-0">
      <SuccessNotice>
        <h2 className="text-center mt-3">
          <FormattedMessage id="secondPillarPaymentRateSuccess.title" />
        </h2>
        <p className="mt-5">
          <FormattedMessage
            id="secondPillarPaymentRateSuccess.description"
            values={{ date: '1. jaanuar 2025', paymentRate: 'x' }}
          />
        </p>
        <a className="btn btn-primary mt-4 profile-link" href="/account">
          <FormattedMessage id="secondPillarPaymentRateSuccess.accountLink" />
        </a>
      </SuccessNotice>
    </div>
  </div>
);
