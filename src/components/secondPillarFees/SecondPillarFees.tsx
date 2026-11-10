import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../common/usePageTitle';
import { useConversion, useFunds, useSourceFunds } from '../common/apiHooks';
import { Fund, SourceFund, UserConversion } from '../common/apiModels';
import { NudgeFeeComparison } from '../common/apiModels/nudge';
import { TulevaSecondPillarStockFund } from '../common/utils';
import { Shimmer } from '../common/shimmer/Shimmer';
import { Notice } from '../common/nudge/Notice';
import { FeeComparisonNotice, NudgeNotice } from '../common/nudge/Nudge';
import { ACCOUNT_PATH } from '../paths';

const HIGH_FEE_FROM = 0.003;
const TULEVA_STOCK_FUND_ISIN: TulevaSecondPillarStockFund = 'EE3600109435';

const secondPillarValue = (sourceFunds: SourceFund[]) =>
  sourceFunds
    .filter((fund) => fund.pillar === 2)
    .reduce((sum, fund) => sum + fund.price + fund.unavailablePrice, 0);

const tulevaStockFundFee = (funds: Fund[]) => {
  const tulevaFund = funds.find((fund) => fund.isin === TULEVA_STOCK_FUND_ISIN);
  if (!tulevaFund) {
    throw new Error(`Fund missing from the fund list: isin=${TULEVA_STOCK_FUND_ISIN}`);
  }
  return tulevaFund.ongoingChargesFigure;
};

const asPercent = (rate: number) => Math.round(rate * 10000) / 100;

const feeComparisonOf = (
  currentFee: number,
  tulevaFee: number,
  value: number,
): NudgeFeeComparison => {
  const currentFeeAmount = Math.round(currentFee * value);
  const tulevaFeeAmount = Math.round(tulevaFee * value);
  return {
    currentFeePercent: asPercent(currentFee),
    currentFeeAmount,
    tulevaFeeAmount,
    savingsAmount: currentFeeAmount - tulevaFeeAmount,
  };
};

const LowFeesNotice = () => (
  <Notice>
    <h2 className="text-center mt-3">
      <FormattedMessage id="secondPillarFees.lowFees.header" />
    </h2>
    <Link className="btn btn-outline-primary mt-4" to={ACCOUNT_PATH}>
      <FormattedMessage id="common.myAccount" />
    </Link>
  </Notice>
);

const SecondPillarStartNotice = () => (
  <NudgeNotice
    header="nudge.SECOND_PILLAR_START.header"
    description="nudge.SECOND_PILLAR_START.description"
    button="nudge.SECOND_PILLAR_START.button"
    to="/2nd-pillar-flow"
  />
);

const FeesNotice = ({
  conversion,
  sourceFunds,
  funds,
}: {
  conversion: UserConversion;
  sourceFunds: SourceFund[];
  funds: Fund[];
}) => {
  const value = secondPillarValue(sourceFunds);
  if (value <= 0) {
    return <SecondPillarStartNotice />;
  }
  const currentFee = conversion.secondPillar.weightedAverageFee;
  if (currentFee < HIGH_FEE_FROM) {
    return <LowFeesNotice />;
  }
  return (
    <FeeComparisonNotice
      feeComparison={feeComparisonOf(currentFee, tulevaStockFundFee(funds), value)}
    />
  );
};

export const SecondPillarFees = () => {
  usePageTitle('pageTitle.secondPillarFees');
  const { data: conversion } = useConversion();
  const { data: sourceFunds } = useSourceFunds();
  const { data: funds } = useFunds();

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto">
      {conversion && sourceFunds && funds ? (
        <FeesNotice conversion={conversion} sourceFunds={sourceFunds} funds={funds} />
      ) : (
        <Shimmer height={26} />
      )}
    </div>
  );
};

export default SecondPillarFees;
