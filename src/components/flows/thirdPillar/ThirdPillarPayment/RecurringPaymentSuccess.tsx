import { useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { captureException } from '@sentry/browser';
import { SuccessNotice } from '../../common/SuccessNotice/SuccessNotice';
import {
  cancelThirdPillarPaymentReminder,
  confirmThirdPillarRecurringPayment,
} from '../../../common/api';
import { Nudge } from '../../../common/nudge/Nudge';

export const RecurringPaymentSuccess = () => {
  useEffect(() => {
    cancelThirdPillarPaymentReminder().catch(captureException);
    confirmThirdPillarRecurringPayment().catch(captureException);
  }, []);

  return (
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
};
