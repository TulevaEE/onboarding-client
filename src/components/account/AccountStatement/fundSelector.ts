import sumBy from 'lodash/sumBy';
import { SourceFund } from '../../common/apiModels';

export function getValueSum(funds: SourceFund[]): number {
  return sumBy(funds, (fund) => fund.price + fund.unavailablePrice);
}

export function getWeightedAverageFee(funds: SourceFund[]): number {
  if (funds.length === 0) {
    return 0;
  }

  const valueSum = getValueSum(funds);
  if (valueSum === 0) {
    const arithmeticMean =
      funds.reduce((accumulator, fund) => accumulator + fund.ongoingChargesFigure, 0) /
      funds.length;
    return arithmeticMean;
  }
  const weightedArithmeticMean = funds.reduce(
    (accumulator, fund) =>
      accumulator + ((fund.price + fund.unavailablePrice) * fund.ongoingChargesFigure) / valueSum,
    0,
  );
  return weightedArithmeticMean;
}
