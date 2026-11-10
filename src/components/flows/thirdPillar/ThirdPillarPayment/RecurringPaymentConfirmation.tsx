import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { captureException } from '@sentry/browser';
import { SuccessNotice } from '../../common/SuccessNotice/SuccessNotice';
import {
  cancelThirdPillarPaymentReminder,
  confirmThirdPillarRecurringPayment,
} from '../../../common/api';
import { Nudge } from '../../../common/nudge/Nudge';

export const RecurringPaymentConfirmation = () => {
  const query = new URLSearchParams(useLocation().search);
  const [confirmed, setConfirmed] = useState(query.get('confirmed') === 'true');
  const history = useHistory();

  useEffect(() => {
    if (!confirmed) {
      return;
    }
    cancelThirdPillarPaymentReminder().catch(captureException);
    confirmThirdPillarRecurringPayment().catch(captureException);
  }, [confirmed]);

  if (!confirmed) {
    return (
      <div className="col-12 col-md-11 col-lg-8 mx-auto text-center py-5">
        <h1 className="mb-4">
          <FormattedMessage id="thirdPillarPayment.confirmation.title.recurring" />
        </h1>
        <div className="d-flex gap-2 justify-content-center">
          <button type="button" className="btn btn-primary" onClick={() => setConfirmed(true)}>
            <FormattedMessage id="thirdPillarPayment.confirmation.yes" />
          </button>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => history.goBack()}
          >
            <FormattedMessage id="thirdPillarPayment.confirmation.showDetails" />
          </button>
        </div>
      </div>
    );
  }

  return <ConfirmedSupportWithNudge />;
};

const ConfirmedSupportWithNudge = () => (
  <>
    <SuccessNotice>
      <h2 className="text-center mt-3">
        <FormattedMessage id="thirdPillarPayment.confirmation.done.title.recurring" />
      </h2>
      <p className="mt-5">
        <FormattedMessage id="thirdPillarPayment.confirmation.done.message.recurring" />
      </p>
      <p>
        <FormattedMessage id="thirdPillarPayment.confirmation.done.message.recurring.firstPayment" />
      </p>
      <a className="btn btn-primary mt-4 profile-link" href="/account">
        <FormattedMessage id="thirdPillarSuccess.button.account" />
      </a>
    </SuccessNotice>
    <Nudge context="THIRD_PILLAR_RECURRING_CONFIRMATION" />
  </>
);
