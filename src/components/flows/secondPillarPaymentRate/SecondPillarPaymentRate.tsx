import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, Redirect } from 'react-router-dom';
import moment from 'moment/moment';
import { AuthenticationLoader, Radio } from '../../common';
import { useSecondPillarPaymentRate } from './hooks';
import { PaymentRate } from './types';
import { useMandateDeadlines, useMe } from '../../common/apiHooks';

export const SecondPillarPaymentRate: React.FunctionComponent = () => {
  const [paymentRate, setPaymentRate] = useState<PaymentRate>(2);

  const {
    changePaymentRate,
    cancelSigning,
    loading: signing,
    challengeCode,
    signedMandateId,
    paymentRateChangeMandateId,
  } = useSecondPillarPaymentRate();

  const { data: user } = useMe();
  const currentPaymentRate = user?.secondPillarPaymentRate || 2;
  const { data: mandateDeadlines } = useMandateDeadlines();

  if (signedMandateId && signedMandateId === paymentRateChangeMandateId) {
    return (
      <Redirect
        to={{
          pathname: '/2nd-pillar-payment-rate-success',
          state: { fulfillmentDate: mandateDeadlines?.paymentRateFulfillmentDate, paymentRate },
        }}
      />
    );
  }

  return (
    <>
      {(signing || challengeCode) && (
        <AuthenticationLoader controlCode={challengeCode} onCancel={cancelSigning} overlayed />
      )}
      <h2 className="mt-3">
        <FormattedMessage id="secondPillarPaymentRate.contributionChange" />
      </h2>
      <p className="mt-3 lead">
        <FormattedMessage id="secondPillarPaymentRate.chooseAmount" />
      </p>
      <p>
        <FormattedMessage id="secondPillarPaymentRate.taxFree" />
      </p>
      <p className="mt-3">
        <FormattedMessage
          id="secondPillarPaymentRate.applicationDeadline"
          values={{
            paymentRateDeadline: moment(mandateDeadlines?.paymentRateDeadline).format('YYYY'),
            paymentRateFulfillmentDate: moment(mandateDeadlines?.paymentRateFulfillmentDate).format(
              'YYYY',
            ),
            b: (chunks: string) => <b>{chunks}</b>,
          }}
        />
      </p>

      <div>
        <Radio
          name="payment-rate"
          id="payment-rate-2"
          className="mt-3"
          selected={paymentRate === 2}
          onSelect={() => setPaymentRate(2)}
        >
          <div className="mb-1">
            <h3 className="d-inline">
              <FormattedMessage id="secondPillarPaymentRate.option.2Percent" />
              {currentPaymentRate === 2 && <Currently />}
            </h3>
          </div>
          <p className="m-0">
            <FormattedMessage
              id="secondPillarPaymentRate.calculation.2Percent"
              values={{ b: (chunks: string) => <b>{chunks}</b> }}
            />
          </p>
        </Radio>
        <Radio
          name="payment-rate"
          id="payment-rate-4"
          className="mt-3"
          selected={paymentRate === 4}
          onSelect={() => setPaymentRate(4)}
        >
          <h3 className="mb-1">
            <FormattedMessage id="secondPillarPaymentRate.option.4Percent" />
            {currentPaymentRate === 4 && <Currently />}
          </h3>
          <p className="m-0">
            <FormattedMessage
              id="secondPillarPaymentRate.calculation.4Percent"
              values={{ b: (chunks: string) => <b>{chunks}</b> }}
            />
          </p>
        </Radio>
        <Radio
          name="payment-rate"
          id="payment-rate-6"
          className="mt-3"
          selected={paymentRate === 6}
          onSelect={() => setPaymentRate(6)}
        >
          <div className="mb-1">
            <h3 className="d-inline">
              <FormattedMessage id="secondPillarPaymentRate.option.6Percent" />
              <Recommended />
              {currentPaymentRate === 6 && <Currently />}
            </h3>
          </div>
          <p className="mb-1">
            <FormattedMessage
              id="secondPillarPaymentRate.calculation.6Percent"
              values={{ b: (chunks: string) => <b>{chunks}</b> }}
            />
          </p>
          <p className="m-0 text-muted">
            <FormattedMessage id="secondPillarPaymentRate.maximumBenefit" />
          </p>
        </Radio>
      </div>

      <div className="mt-5">
        <button
          type="button"
          className="btn btn-primary mb-2 mr-2"
          disabled={paymentRate === currentPaymentRate}
          onClick={() => changePaymentRate(paymentRate)}
        >
          <FormattedMessage id="secondPillarPaymentRate.confirm.mandate.sign" />
        </button>

        <Link to="/account">
          <button type="button" className="btn btn-light mb-2">
            <FormattedMessage id="secondPillarPaymentRate.cancel" />
          </button>
        </Link>
      </div>
    </>
  );
};

const Currently = () => (
  <span className="ml-2 badge badge-pill badge-secondary align-text-bottom">
    <FormattedMessage id="secondPillarPaymentRate.current" />
  </span>
);

const Recommended = () => (
  <span className="ml-2 badge badge-pill badge-primary align-text-bottom">
    <FormattedMessage id="secondPillarPaymentRate.recommended" />
  </span>
);
