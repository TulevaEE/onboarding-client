import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useSelector } from 'react-redux';
import { finish as finishProcedure } from '../../../TriggerProcedure/utils';
import { State } from '../../../../types';
import { SuccessNotice2 } from '../../common/SuccessNotice2/SuccessNotice2';
import { Nudge } from '../../../common/nudge/Nudge';
import { BackToInternetBankButton } from './BackToInternetBankButton';

export const BackToPartner: React.FC = () => {
  const personalCode = useSelector<State, string | undefined>(
    (state) => state.login.user?.personalCode,
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState(false);

  const finishWith = async (result: 'newPayment' | 'newRecurringPayment') => {
    setError(false);
    setSubmitting(true);
    try {
      await finishProcedure(result, undefined, personalCode);
    } catch (err) {
      // eslint-disable-next-line no-console -- make this flow more debuggable for 3rd parties
      console.error('error on finish', err);
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SuccessNotice2>
        <h2 className="mt-3">
          <FormattedMessage id="thirdPillarBackToPartner.opened" />
        </h2>
        <div className="d-flex justify-content-center mt-4">
          <a className="btn btn-outline-primary flex-grow-1 flex-md-grow-0" href="/account">
            <FormattedMessage id="thirdPillarBackToPartner.account" />
          </a>
        </div>
        <div className="d-flex justify-content-center mt-2">
          <button
            type="button"
            className="btn btn-outline-primary flex-grow-1 flex-md-grow-0"
            disabled={!personalCode || submitting}
            onClick={() => finishWith('newPayment')}
          >
            <FormattedMessage id="thirdPillarBackToPartner.singlePayment.button" />
          </button>
        </div>
        {error && (
          <p className="text-danger mt-2 mb-0">
            <FormattedMessage id="partnerFlow.error" />
          </p>
        )}
        <p className="mt-2 mb-0">
          <small className="text-body-secondary">
            <FormattedMessage id="thirdPillarBackToPartner.payment.subtitle" />
          </small>
        </p>
        <BackToInternetBankButton />
      </SuccessNotice2>
      <Nudge
        context="THIRD_PILLAR_MANDATE"
        onRecurringPayment={() => {
          if (personalCode && !submitting) {
            finishWith('newRecurringPayment');
          }
        }}
      />
    </>
  );
};

export default BackToPartner;
