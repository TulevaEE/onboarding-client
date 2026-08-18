import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { captureException } from '@sentry/browser';
import { SuccessNotice } from '../../common/SuccessNotice/SuccessNotice';
import { cancelThirdPillarPaymentReminder } from '../../../common/api';
import { useConversion, useMe, usePendingApplications } from '../../../common/apiHooks';
import { secondPillarSuggestion } from '../secondPillarNudge/secondPillarSuggestion';
import { SecondPillarNudge } from '../secondPillarNudge/SecondPillarNudge';
import { AvailablePaymentType } from './types';

export const RecurringPaymentConfirmation = () => {
  const query = new URLSearchParams(useLocation().search);
  const paymentType: AvailablePaymentType = query.get('type') === 'SINGLE' ? 'SINGLE' : 'RECURRING';
  const [confirmed, setConfirmed] = useState(query.get('confirmed') === 'true');
  const history = useHistory();

  useEffect(() => {
    if (confirmed) {
      cancelThirdPillarPaymentReminder().catch(captureException);
    }
  }, [confirmed]);

  if (!confirmed) {
    return (
      <div className="col-12 col-md-11 col-lg-8 mx-auto text-center py-5">
        <h1 className="mb-4">
          <FormattedMessage
            id={
              paymentType === 'SINGLE'
                ? 'thirdPillarPayment.confirmation.title.single'
                : 'thirdPillarPayment.confirmation.title.recurring'
            }
          />
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

  return <ConfirmedSupportWithNudge paymentType={paymentType} />;
};

const ConfirmedSupportWithNudge = ({ paymentType }: { paymentType: AvailablePaymentType }) => {
  const { data: conversion } = useConversion();
  const { data: user } = useMe();
  const { data: pendingApplications } = usePendingApplications();

  const suggestion =
    user && conversion && pendingApplications
      ? secondPillarSuggestion(user, conversion.secondPillar, pendingApplications)
      : undefined;
  const supportOnly = suggestion === 'NONE' || suggestion === 'PENDING_TRANSFER';

  return (
    <>
      <SuccessNotice>
        <h2 className="text-center mt-3">
          <FormattedMessage
            id={
              paymentType === 'RECURRING'
                ? 'thirdPillarPayment.confirmation.done.title.recurring'
                : 'thirdPillarSuccess.done'
            }
          />
        </h2>
        <p className="mt-5">
          <FormattedMessage
            id={
              paymentType === 'RECURRING'
                ? 'thirdPillarPayment.confirmation.done.message.recurring'
                : 'thirdPillarSuccess.message'
            }
          />
        </p>
        {supportOnly && (
          <a className="btn btn-primary mt-4 profile-link" href="/account">
            <FormattedMessage id="thirdPillarSuccess.button.account" />
          </a>
        )}
      </SuccessNotice>
      <SecondPillarNudge />
    </>
  );
};
