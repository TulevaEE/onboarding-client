import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, Redirect } from 'react-router-dom';
import { AuthenticationLoader, Radio } from '../../common';
import { useSecondPillarPaymentRate } from './hooks';
import { PaymentRate } from './types';

export const SecondPillarPaymentRate: React.FunctionComponent = () => {
  const [paymentRate, setPaymentRate] = useState<PaymentRate>(2);
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);

  const {
    changePaymentRate,
    cancelSigning,
    loading: signing,
    challengeCode,
    signedMandateId,
    paymentRateChangeMandateId,
  } = useSecondPillarPaymentRate();

  if (signedMandateId && signedMandateId === paymentRateChangeMandateId) {
    return <Redirect to="/2nd-pillar-payment-rate-success" />;
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
        <FormattedMessage
          id="secondPillarPaymentRate.chooseAmount"
          values={{ date: <span className="text-nowrap">1. jaanuar 2025</span> }}
        />
      </p>
      <p>
        <FormattedMessage id="secondPillarPaymentRate.taxFree" />
      </p>
      <p className="mt-3 text-muted">
        <FormattedMessage
          id="secondPillarPaymentRate.applicationDeadline"
          values={{ deadline: <span className="text-nowrap">30. november 2024</span> }}
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
          <h3 className="mb-1">
            <FormattedMessage id="secondPillarPaymentRate.option.2Percent" />
          </h3>
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
              <span className="ml-2 badge badge-pill badge-primary align-text-bottom">
                <FormattedMessage id="secondPillarPaymentRate.recommended" />
              </span>
            </h3>{' '}
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

      <p className="mt-5 lead">
        <FormattedMessage id="secondPillarPaymentRate.confirmation" />
      </p>

      <div className="custom-control custom-checkbox">
        <input
          checked={agreedToTerms}
          onChange={() => setAgreedToTerms(!agreedToTerms)}
          type="checkbox"
          className="custom-control-input"
          id="agree-to-terms-checkbox"
        />
        <label className="custom-control-label" htmlFor="agree-to-terms-checkbox">
          <FormattedMessage id="secondPillarPaymentRate.confirm.mandate.agree.to.terms" />
        </label>
      </div>

      <div className="mt-5">
        <button
          type="button"
          className="btn btn-primary mb-2 mr-2"
          disabled={!agreedToTerms}
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
