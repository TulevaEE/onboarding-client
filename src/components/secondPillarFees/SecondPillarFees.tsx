import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../common/usePageTitle';
import { useConversion, useFunds, useSourceFunds } from '../common/apiHooks';
import { Fund, SourceFund, UserConversion } from '../common/apiModels';
import { NudgeFeeComparison } from '../common/apiModels/nudge';
import { TUK75_ISIN } from '../common/fundPrecision';
import { isLowFee, wholeEuros } from '../common/fees';
import { getValueSum } from '../account/AccountStatement/fundSelector';
import { Shimmer } from '../common/shimmer/Shimmer';
import { FeeComparison } from '../common/nudge/Nudge';
import { TranslationKey } from '../translations';
import { ACCOUNT_PATH } from '../paths';

const asPercent = (rate: number) => wholeEuros(rate * 10000) / 100;

const feeComparisonOf = (
  currentFee: number,
  tulevaFee: number,
  value: number,
): NudgeFeeComparison | null => {
  if (isLowFee(currentFee)) {
    return null;
  }
  const currentFeeAmount = wholeEuros(currentFee * value);
  const tulevaFeeAmount = wholeEuros(tulevaFee * value);
  if (currentFeeAmount <= tulevaFeeAmount) {
    return null;
  }
  return {
    currentFeePercent: asPercent(currentFee),
    currentFeeAmount,
    tulevaFeeAmount,
    savingsAmount: currentFeeAmount - tulevaFeeAmount,
  };
};

const Message = ({ header }: { header: TranslationKey }) => (
  <>
    <h2 className="text-center mt-3">
      <FormattedMessage id={header} />
    </h2>
    <Link className="btn btn-outline-primary mt-4" to={ACCOUNT_PATH}>
      <FormattedMessage id="common.myAccount" />
    </Link>
  </>
);

const Fees = ({
  conversion,
  sourceFunds,
  funds,
}: {
  conversion: UserConversion;
  sourceFunds: SourceFund[];
  funds: Fund[];
}) => {
  const value = getValueSum(sourceFunds.filter((fund) => fund.pillar === 2));
  if (value <= 0) {
    return <Message header="secondPillarFees.noSavings.header" />;
  }
  const tulevaFund = funds.find((fund) => fund.isin === TUK75_ISIN);
  if (!tulevaFund) {
    return <Message header="error.messages.intro" />;
  }
  const feeComparison = feeComparisonOf(
    conversion.secondPillar.weightedAverageFee,
    tulevaFund.ongoingChargesFigure,
    value,
  );
  if (!feeComparison) {
    return <Message header="secondPillarFees.lowFees.header" />;
  }
  return <FeeComparison feeComparison={feeComparison} to="/2nd-pillar-funds" buttonSize="large" />;
};

export const SecondPillarFees = () => {
  usePageTitle('pageTitle.secondPillarFees');
  const conversion = useConversion();
  const sourceFunds = useSourceFunds();
  const funds = useFunds();
  const queries = [conversion, sourceFunds, funds];

  const content = () => {
    if (queries.some((query) => query.isError)) {
      return <Message header="error.messages.intro" />;
    }
    if (!conversion.data || !sourceFunds.data || !funds.data) {
      return <Shimmer height={26} />;
    }
    return <Fees conversion={conversion.data} sourceFunds={sourceFunds.data} funds={funds.data} />;
  };

  return <div className="col-12 col-md-10 col-lg-7 mx-auto text-center py-4">{content()}</div>;
};
