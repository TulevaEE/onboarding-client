import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, Redirect } from 'react-router-dom';
import { AuthenticationLoader, ErrorMessage, Radio } from '../../common';
import { useSecondPillarPaymentRate } from './hooks';
import { PaymentRate } from './types';
import { useMandateDeadlines, useMe } from '../../common/apiHooks';
import { SecondPillarPaymentRateTaxWin } from './SecondPillarPaymentRateTaxWin';
import { formatDateYear } from '../../common/dateFormatter';

export const SecondPillarPaymentRate: React.FunctionComponent = () => {
  const { data: user } = useMe();
  const pendingPaymentRate =
    user?.secondPillarPaymentRates.pending || user?.secondPillarPaymentRates.current || null;

  const [paymentRate, setPaymentRate] = useState<PaymentRate | null>(null);

  useEffect(() => {
    setPaymentRate(pendingPaymentRate);
  }, [pendingPaymentRate]);

  const {
    changePaymentRate,
    cancelSigning,
    loading: signing,
    challengeCode,
    signedMandateId,
    paymentRateChangeMandateId,
    error,
    resetError,
  } = useSecondPillarPaymentRate();

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
    <div className="col-lg-8 offset-lg-2 px-0">
      {(signing || challengeCode) && (
        <AuthenticationLoader controlCode={challengeCode} onCancel={cancelSigning} overlayed />
      )}

      {error && <ErrorMessage errors={error.body} onCancel={resetError} overlayed />}

      <h2 className="mt-3">
        <FormattedMessage id="secondPillarPaymentRate.contributionChange" />
      </h2>
      <p className="mt-3">
        {!pendingPaymentRate || pendingPaymentRate < 6 ? (
          <>
            <SecondPillarPaymentRateTaxWin />.{' '}
          </>
        ) : (
          ''
        )}
        <FormattedMessage
          id="secondPillarPaymentRate.applicationDeadline"
          values={{
            paymentRateFulfillmentDate: formatDateYear(
              mandateDeadlines?.paymentRateFulfillmentDate,
            ),
          }}
        />
      </p>
      <p className="mt-3">
        <FormattedMessage id="secondPillarPaymentRate.chooseContributionRate" />
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
              <span className="mr-2">
                <FormattedMessage id="secondPillarPaymentRate.option.2Percent" />
              </span>
              {pendingPaymentRate === 2 && <Currently />}
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
            <span className="mr-2">
              <FormattedMessage id="secondPillarPaymentRate.option.4Percent" />
            </span>
            {pendingPaymentRate === 4 && <Currently />}
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
              <span className="mr-2">
                <FormattedMessage id="secondPillarPaymentRate.option.6Percent" />
              </span>
              <Recommended />
              {pendingPaymentRate === 6 && <Currently />}
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

      <div className="d-flex flex-column-reverse flex-md-row justify-content-between mt-4">
        <Link className="btn btn-light mt-2" to="/account">
          <FormattedMessage id="secondPillarPaymentRate.cancel" />
        </Link>
        <button
          type="button"
          className="btn btn-primary mt-2"
          disabled={!paymentRate || paymentRate === pendingPaymentRate}
          onClick={() => paymentRate && changePaymentRate(paymentRate)}
        >
          <FormattedMessage id="secondPillarPaymentRate.confirm.mandate.sign" />
        </button>
      </div>
    </div>
  );
};

const Currently = () => (
  <span className="badge badge-pill badge-secondary align-text-bottom">
    <FormattedMessage id="secondPillarPaymentRate.current" />
  </span>
);

const Recommended = () => (
  <span className="mr-2 badge badge-pill badge-primary align-text-bottom">
    <FormattedMessage id="secondPillarPaymentRate.recommended" />
  </span>
);
