import sumBy from 'lodash/sumBy';
import { SourceFund } from '../../common/apiModels';

export function getValueSum(funds: SourceFund[]): number {
  return sumBy(funds, (fund) => {
    return fund.price + fund.unavailablePrice;
  });
}

export function getWeightedAverageFee(funds: SourceFund[]): number {
  const valueSum = getValueSum(funds);
  return funds.reduce(
    (accumulator, fund) =>
      accumulator + ((fund.price + fund.unavailablePrice) * fund.ongoingChargesFigure) / valueSum,
    0,
  );
}
