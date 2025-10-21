import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useLocation, Link } from 'react-router-dom';
import { Location } from 'history';
import config from 'react-global-configuration';
import { SuccessNotice } from '../common/SuccessNotice/SuccessNotice';
import { useMandateDeadlines, useConversion } from '../../common/apiHooks';
import { formatDateYear } from '../../common/dateFormatter';

export const SecondPillarPaymentRateSuccess: React.FC = () => {
  const location: Location<{ fulfillmentDate: string; paymentRate: number; isDecreased: boolean }> =
    useLocation();
  const { paymentRate, isDecreased } = location.state || {};
  const { data: mandateDeadlines } = useMandateDeadlines();
  const { data: conversion } = useConversion();

  const hasHighFees = conversion && conversion.secondPillar.weightedAverageFee > 0.005;

  return (
    <SuccessNotice>
      <h2 className="text-center mt-3">
        <FormattedMessage
          id={
            isDecreased
              ? 'secondPillarPaymentRateSuccess.title.decrease'
              : 'secondPillarPaymentRateSuccess.title.increase'
          }
        />
      </h2>
      <p className="mt-5">
        <FormattedMessage
          id={
            isDecreased
              ? 'secondPillarPaymentRateSuccess.descriptionNewRate.decrease'
              : 'secondPillarPaymentRateSuccess.descriptionNewRate.increase'
          }
          values={{
            paymentRateFulfillmentDate:
              formatDateYear(mandateDeadlines?.paymentRateFulfillmentDate) || '...',
            paymentRate: paymentRate || '...',
            paymentRateDeadline: formatDateYear(mandateDeadlines?.paymentRateDeadline) || '...',
            b: (chunks: string) => <b>{chunks}</b>,
          }}
        />
      </p>

      {hasHighFees && (
        <p className="m-0">
          <FormattedMessage
            id="secondPillarPaymentRateSuccess.highFeesWarning"
            values={{
              b: (chunks: string) => <b>{chunks}</b>,
            }}
          />
        </p>
      )}

      {hasHighFees && (
        <Link className="btn btn-primary mt-5" to="/2nd-pillar-flow">
          <FormattedMessage id="secondPillarPaymentRateSuccess.reviewFeesLink" />
        </Link>
      )}

      {!hasHighFees && config.get('language') === 'en' && (
        <a className="btn btn-primary mt-5" href="/account?language=en">
          <FormattedMessage id="secondPillarPaymentRateSuccess.accountLink" />
        </a>
      )}

      {!hasHighFees && config.get('language') !== 'en' && (
        <a className="btn btn-primary mt-5" href="/account">
          <FormattedMessage id="secondPillarPaymentRateSuccess.accountLink" />
        </a>
      )}
    </SuccessNotice>
  );
};
