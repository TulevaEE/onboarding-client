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
      <h2 className="mt-3">II samba panuse muutmine</h2>
      <p className="mt-3 lead">
        Vali, kui palju soovid II sambasse igakuiselt panustada alates 1. jaanuar 2025.
      </p>
      <p className="mt-3">
        II samba panused on tulumaksuvabad. Saad maksusoodustusega säästa tänasest veelgi rohkem.
      </p>

      <div>
        <Radio
          name="payment-rate"
          id="payment-rate-2"
          className="mt-3"
          selected={paymentRate === 2}
          onSelect={() => {
            setPaymentRate(2);
          }}
        >
          <h3 className="mb-1">2% brutopalgast</h3>
          <p className="m-0">
            Sina panustad 2% ja riik 4%, kokku säästad <b>6%</b>
          </p>
        </Radio>
        <Radio
          name="payment-rate"
          id="payment-rate-4"
          className="mt-3"
          selected={paymentRate === 4}
          onSelect={() => {
            setPaymentRate(4);
          }}
        >
          <h3 className="mb-1">4% brutopalgast</h3>
          <p className="m-0">
            Sina panustad 4% ja riik 4%, kokku säästad <b>8%</b>
          </p>
        </Radio>
        <Radio
          name="payment-rate"
          id="payment-rate-6"
          className="mt-3"
          selected={paymentRate === 6}
          onSelect={() => {
            setPaymentRate(6);
          }}
        >
          <h3 className="mb-1">6% brutopalgast</h3>
          <p className="m-0">
            Sina panustad 6% ja riik 4%, kokku säästad <b>10%</b>
          </p>
          <p className="m-0 text-muted">
            Sellega saad suurima maksuvõidu ja kogud II sambasse maksimaalselt
          </p>
        </Radio>
      </div>

      <p className="mt-5 lead">Kinnitamine</p>

      <div className="custom-control custom-checkbox">
        <input
          checked={agreedToTerms}
          onChange={() => {
            setAgreedToTerms(!agreedToTerms);
          }}
          type="checkbox"
          className="custom-control-input"
          id="agree-to-terms-checkbox"
        />
        <label className="custom-control-label" htmlFor="agree-to-terms-checkbox">
          <FormattedMessage id="confirm.mandate.agree.to.terms" />
        </label>
      </div>

      <div className="mt-5">
        <button
          type="button"
          className="btn btn-primary mb-2 mr-2"
          disabled={!agreedToTerms}
          onClick={() => {
            changePaymentRate(paymentRate);
          }}
        >
          <FormattedMessage id="confirm.mandate.sign" />
        </button>

        <Link to="/account">
          <button type="button" className="btn btn-light mb-2">
            Katkesta
          </button>
        </Link>
      </div>
    </>
  );
};
