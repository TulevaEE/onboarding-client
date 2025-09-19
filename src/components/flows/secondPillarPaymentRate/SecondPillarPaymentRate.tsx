import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, Redirect } from 'react-router-dom';
import { AuthenticationLoader, ErrorMessage, Loader, Radio } from '../../common';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { usePageTitle } from '../../common/usePageTitle';
import { useSecondPillarPaymentRate } from './hooks';
import { PaymentRate } from './types';
import { useMandateDeadlines, useMe } from '../../common/apiHooks';
import { formatDateYear } from '../../common/dateFormatter';

export const SecondPillarPaymentRate: React.FunctionComponent = () => {
  usePageTitle('pageTitle.secondPillarPayment');

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

  if (!user) {
    return <Loader className="align-middle my-4" />;
  }

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
    <div className="col-12 col-md-11 col-lg-8 mx-auto">
      {(signing || challengeCode) && (
        <AuthenticationLoader controlCode={challengeCode} onCancel={cancelSigning} overlayed />
      )}

      {error && <ErrorMessage errors={error.body} onCancel={resetError} overlayed />}

      <h1 className="mb-3">
        <FormattedMessage id="secondPillarPaymentRate.contributionChange" />
      </h1>
      <p className="mb-5">
        {!mandateDeadlines ? (
          <Shimmer height={24} />
        ) : (
          <FormattedMessage
            id="secondPillarPaymentRate.applicationDeadline"
            values={{
              paymentRateFulfillmentDate: formatDateYear(
                mandateDeadlines?.paymentRateFulfillmentDate,
              ),
            }}
          />
        )}
      </p>
      <p className="mb-4">
        <FormattedMessage id="secondPillarPaymentRate.chooseContributionRate" />
      </p>

      <div className="d-flex flex-column gap-2">
        <Radio
          name="payment-rate"
          id="payment-rate-2"
          selected={paymentRate === 2}
          onSelect={() => setPaymentRate(2)}
        >
          <p className="mb-1">
            <span className="fs-3 lh-sm fw-medium me-2">
              <FormattedMessage id="secondPillarPaymentRate.option.2Percent" />
            </span>
            {pendingPaymentRate === 2 && <Currently />}
          </p>
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
          selected={paymentRate === 4}
          onSelect={() => setPaymentRate(4)}
        >
          <p className="mb-1">
            <span className="fs-3 lh-sm fw-medium me-2">
              <FormattedMessage id="secondPillarPaymentRate.option.4Percent" />
            </span>
            {pendingPaymentRate === 4 && <Currently />}
          </p>
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
          selected={paymentRate === 6}
          onSelect={() => setPaymentRate(6)}
        >
          <p className="mb-1">
            <span className="fs-3 lh-sm fw-medium me-2">
              <FormattedMessage id="secondPillarPaymentRate.option.6Percent" />
            </span>
            <Recommended />
            {pendingPaymentRate === 6 && <Currently />}
          </p>
          <p className="mb-1">
            <FormattedMessage
              id="secondPillarPaymentRate.calculation.6Percent"
              values={{ b: (chunks: string) => <b>{chunks}</b> }}
            />
          </p>
          <p className="m-0 text-body-secondary">
            <FormattedMessage id="secondPillarPaymentRate.maximumBenefit" />
          </p>
        </Radio>
      </div>

      <div className="mt-5 d-flex flex-column-reverse flex-md-row justify-content-between">
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
  <span className="badge rounded-pill text-bg-secondary align-text-bottom">
    <FormattedMessage id="secondPillarPaymentRate.current" />
  </span>
);

const Recommended = () => (
  <span className="me-1 badge rounded-pill text-bg-primary align-text-bottom">
    <FormattedMessage id="secondPillarPaymentRate.recommended" />
  </span>
);
