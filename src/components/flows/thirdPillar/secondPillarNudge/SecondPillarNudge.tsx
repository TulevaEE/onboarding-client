import React, { useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { useLocation } from 'react-router-dom';
import { Notice } from '../../common/Notice/Notice';
import styles from './SecondPillarNudge.module.scss';
import { getValueSum } from '../../../account/AccountStatement/fundSelector';
import { createTrackedEvent } from '../../../common/api';
import {
  useConversion,
  useFunds,
  useMe,
  usePendingApplications,
  useSourceFunds,
} from '../../../common/apiHooks';
import { Fund } from '../../../common/apiModels';
import { TranslationKey } from '../../../translations';
import { secondPillarSuggestion } from './secondPillarSuggestion';

export const SecondPillarNudge = () => {
  const { data: sourceFunds } = useSourceFunds();
  const { data: conversion } = useConversion();
  const { data: funds } = useFunds();
  const { data: user } = useMe();
  const { data: pendingApplications } = usePendingApplications();
  const { pathname } = useLocation();

  const suggestion =
    user && conversion && pendingApplications
      ? secondPillarSuggestion(user, conversion.secondPillar, pendingApplications)
      : undefined;

  useEffect(() => {
    if (suggestion && suggestion !== 'NONE') {
      createTrackedEvent('PAGE_VIEW', { path: pathname, secondPillarNudge: suggestion }).catch(
        () => {},
      );
    }
  }, [suggestion, pathname]);

  if (!sourceFunds || !conversion || !funds || !user || !pendingApplications || !suggestion) {
    return null;
  }

  const tulevaSecondPillarFund = funds.find(({ isin }) => isin === 'EE3600109435');

  switch (suggestion) {
    case 'PENDING_TRANSFER':
      return (
        <Notice>
          <p className="m-0">
            <FormattedMessage id="thirdPillarSuccess.suggestion.pending.description" />
          </p>
        </Notice>
      );
    case 'TRANSFER_HIGH_FEE':
      return tulevaSecondPillarFund ? (
        <FeeComparisonNotice
          tulevaSecondPillarFund={tulevaSecondPillarFund}
          weightedAverageFee={conversion.secondPillar.weightedAverageFee}
          totalValue={getValueSum(sourceFunds.filter(({ pillar }) => pillar === 2))}
        />
      ) : (
        <TransferNotice />
      );
    case 'TRANSFER_LOW_FEE':
      return <TransferNotice />;
    case 'INCREASE_PAYMENT_RATE':
      return (
        <SuggestionNotice
          headerId="thirdPillarSuccess.suggestion.paymentRate.header"
          descriptionId="thirdPillarSuccess.suggestion.paymentRate.description"
          buttonId="thirdPillarSuccess.suggestion.paymentRate.button"
          to="/2nd-pillar-payment-rate"
        />
      );
    case 'MEMBERSHIP':
      return (
        <SuggestionNotice
          headerId="thirdPillarSuccess.suggestion.membership.header"
          descriptionId="thirdPillarSuccess.suggestion.membership.description"
          buttonId="thirdPillarSuccess.suggestion.membership.button"
          to="/join"
        />
      );
    case 'RECURRING_PAYMENT':
      return (
        <SuggestionNotice
          headerId="thirdPillarSuccess.suggestion.recurring.header"
          descriptionId="thirdPillarSuccess.suggestion.recurring.description"
          buttonId="thirdPillarSuccess.suggestion.recurring.button"
          to="/3rd-pillar-payment"
        />
      );
    case 'NONE':
    default:
      return null;
  }
};

const TransferNotice = () => (
  <SuggestionNotice
    headerId="thirdPillarSuccess.suggestion.lowFee.header"
    descriptionId="thirdPillarSuccess.suggestion.lowFee.description"
    buttonId="thirdPillarSuccess.suggestion.lowFee.button"
    to="/2nd-pillar-flow"
  />
);

const SuggestionNotice = ({
  headerId,
  descriptionId,
  buttonId,
  to,
}: {
  headerId: TranslationKey;
  descriptionId: TranslationKey;
  buttonId: TranslationKey;
  to: string;
}) => (
  <Notice>
    <h2 className="text-center mt-3">
      <FormattedMessage id={headerId} />
    </h2>
    <p className="mt-5">
      <FormattedMessage id={descriptionId} />
    </p>
    <a className="btn btn-primary mt-4 profile-link" href={to}>
      <FormattedMessage id={buttonId} />
    </a>
  </Notice>
);

const FeeComparisonNotice = ({
  tulevaSecondPillarFund,
  weightedAverageFee,
  totalValue,
}: {
  tulevaSecondPillarFund: Fund;
  weightedAverageFee: number;
  totalValue: number;
}) => {
  const maximumFundColumnHeight = 150;
  const ourFundFeeAmount = Math.round(tulevaSecondPillarFund.ongoingChargesFigure * totalValue);
  const currentFundsFeeAmount = Math.round(weightedAverageFee * totalValue);
  const maxAmount = Math.max(ourFundFeeAmount, currentFundsFeeAmount);
  const ourFundHeight = (ourFundFeeAmount / maxAmount) * maximumFundColumnHeight;
  const currentFundsHeight = (currentFundsFeeAmount / maxAmount) * maximumFundColumnHeight;
  const currentFundsFee = Math.round(weightedAverageFee * 10000) / 100;
  const savingsAmount = currentFundsFeeAmount - ourFundFeeAmount;

  return (
    <Notice>
      <h2 className="text-center mt-3">
        <FormattedMessage id="thirdPillarSuccess.notice.header" />
      </h2>
      <div>
        <div className="row d-flex justify-content-center align-items-end mt-5">
          <div className="col-md-2 col-5">
            <div
              className={styles.leftcolumn}
              style={{
                height: ourFundHeight,
              }}
            >
              <div className={styles.columncontent}>{ourFundFeeAmount}&nbsp;€</div>
            </div>
          </div>
          <div className="col-md-2 col-1" />
          <div className="col-md-2 col-5">
            <div
              className={styles.rightcolumn}
              style={{
                height: currentFundsHeight,
              }}
            >
              <div className={styles.columncontent}>{currentFundsFeeAmount}&nbsp;€</div>
            </div>
          </div>
        </div>
        <div className="row d-flex justify-content-center align-items-start my-3">
          <div className="col-md-3 col-5">
            <small className="text-body-secondary">
              <FormattedMessage id="thirdPillarSuccess.ourFund" />
            </small>
          </div>
          <div className="col-md-1 col-1" />
          <div className="col-md-3 col-5">
            <small className="text-body-secondary">
              <FormattedMessage id="thirdPillarSuccess.currentFund" />
            </small>
          </div>
        </div>
      </div>
      <p className="mt-5">
        <FormattedMessage
          id="thirdPillarSuccess.notice.description"
          values={{ currentFundsFee, currentFundsFeeAmount, ourFundFeeAmount, savingsAmount }}
        />
      </p>
      <a className="btn btn-primary mt-4 profile-link" href="/2nd-pillar-flow">
        <FormattedMessage id="thirdPillarSuccess.button" />
      </a>
    </Notice>
  );
};
