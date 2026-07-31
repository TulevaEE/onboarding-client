import moment from 'moment';
import { Transaction } from '../../common/apiModels';

export type CostBasisMethod = 'FIFO' | 'WEIGHTED_AVERAGE';

export interface RealisedGain {
  time: string;
  units: number;
  acquisitionCost: number;
  proceeds: number;
  gain: number;
}

interface Lot {
  units: number;
  unitCost: number;
}

const isAcquisition = (transaction: Transaction): boolean =>
  transaction.type === 'CONTRIBUTION_CASH' || transaction.type === 'CONTRIBUTION_CASH_WORKPLACE';

const byTime = (a: Transaction, b: Transaction): number =>
  moment(a.time).valueOf() - moment(b.time).valueOf();

/**
 * Removes the disposed units from the holding and reports what they cost to acquire.
 * FIFO takes the oldest units first; the weighted average method prices every unit at
 * the average cost of the holding on the disposal date.
 */
const consumeLots = (
  lots: Lot[],
  units: number,
  method: CostBasisMethod,
): { acquisitionCost: number; remainingLots: Lot[] } => {
  const totalUnits = lots.reduce((sum, lot) => sum + lot.units, 0);
  const totalCost = lots.reduce((sum, lot) => sum + lot.units * lot.unitCost, 0);
  const averageUnitCost = totalUnits > 0 ? totalCost / totalUnits : 0;

  const remainingLots: Lot[] = [];
  let remaining = units;
  let fifoCost = 0;

  lots.forEach((lot) => {
    const taken = Math.min(lot.units, Math.max(remaining, 0));
    fifoCost += taken * lot.unitCost;
    remaining -= taken;
    if (lot.units - taken > 1e-9) {
      remainingLots.push({ units: lot.units - taken, unitCost: lot.unitCost });
    }
  });

  if (method === 'WEIGHTED_AVERAGE') {
    const unitsLeft = totalUnits - units;
    return {
      acquisitionCost: units * averageUnitCost,
      remainingLots: unitsLeft > 1e-9 ? [{ units: unitsLeft, unitCost: averageUnitCost }] : [],
    };
  }

  return { acquisitionCost: fifoCost, remainingLots };
};

/**
 * Walks the whole history up to the closing date, because the acquisition cost of a
 * disposal depends on every purchase that came before it.
 */
const realiseAll = (
  transactions: Transaction[],
  to: string,
  method: CostBasisMethod,
): RealisedGain[] => {
  let lots: Lot[] = [];
  const realised: RealisedGain[] = [];

  transactions
    .filter((transaction) => moment(transaction.time).isSameOrBefore(moment(to).endOf('day')))
    .sort(byTime)
    .forEach((transaction) => {
      const units = Math.abs(transaction.units);
      const amount = Math.abs(transaction.amount);

      if (isAcquisition(transaction)) {
        lots.push({ units, unitCost: transaction.nav });
        return;
      }

      const { acquisitionCost, remainingLots } = consumeLots(lots, units, method);
      lots = remainingLots;
      realised.push({
        time: transaction.time,
        units,
        acquisitionCost,
        proceeds: amount,
        gain: amount - acquisitionCost,
      });
    });

  return realised;
};

export const getRealisedGainsBetween = (
  transactions: Transaction[],
  from: string,
  to: string,
  method: CostBasisMethod = 'WEIGHTED_AVERAGE',
): RealisedGain[] =>
  realiseAll(transactions, to, method).filter((realisedGain) =>
    moment(realisedGain.time).isSameOrAfter(moment(from).startOf('day')),
  );
