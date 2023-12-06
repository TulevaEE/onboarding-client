import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { Radio } from '../../common';

export type PaymentRate = 2 | 4 | 6;
export const SecondPillarPaymentRate: React.FunctionComponent = () => {
  const [paymentRate, setPaymentRate] = useState<PaymentRate>(2);
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);

  return (
    <>
      <h2 className="mt-3">II samba panuse muutmine</h2>
      <p className="mt-3 lead">
        Vali, kui palju soovid II sambasse igakuiselt panustada alates 1. jaanuar 2025.
      </p>
      <p className="mt-3">
        II samba panused on tulumaksuvabad. Saad maksusoodustusega säästa tänasest veelgi rohkem.
      </p>
      <Radio
        name="payment-rate"
        id="payment-rate-2"
        className="mt-3"
        selected={paymentRate === 2}
        onSelect={() => {
          setPaymentRate(2);
        }}
        alignRadioCenter
      >
        <h3 className="mb-1">2% brutopalgast</h3>
        <p className="m-0">
          Sina panustad 2% ja riik 4%&ensp;·&ensp;Kokku säästad <b>6%</b> brutopalgast
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
        alignRadioCenter
      >
        <h3 className="mb-1">4% brutopalgast</h3>
        <p className="m-0">
          Sina panustad 4% ja riik 4%&ensp;·&ensp;Kokku säästad <b>8%</b> brutopalgast
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
        alignRadioCenter
      >
        <h3 className="mb-1">6% brutopalgast</h3>
        <p className="m-0">
          Sina panustad 6% ja riik 4%&ensp;·&ensp;Kokku säästad <b>10%</b> brutopalgast
        </p>
        <p className="m-0 text-muted">
          Sellega saad <span className="text-success">suurima maksuvõidu</span> ja kogud II sambasse
          maksimaalselt
        </p>
      </Radio>

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
          <small className="text-muted">
            <FormattedMessage id="confirm.mandate.agree.to.terms" />
          </small>
        </label>
      </div>

      <div className="mt-5">
        <button
          type="button"
          className="btn btn-primary mb-2 mr-2"
          disabled={!agreedToTerms}
          onClick={() => {
            // eslint-disable-next-line no-console
            console.log('click sign');
          }}
        >
          <FormattedMessage id="confirm.mandate.sign" />
        </button>

        <Link to="/account">
          <button type="button" className="btn btn-light mb-2">
            Tühista
          </button>
        </Link>
      </div>
    </>
  );
};
