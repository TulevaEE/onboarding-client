import { formatExactUnits, formatUnits, isRoundedUnits } from './fundPrecision';
import { PII_CLASS } from '../tracking/piiMarkup';

export const Units = ({ units }: { units: number }) => (
  <span
    className={`text-nowrap ${PII_CLASS}`}
    title={isRoundedUnits(units) ? formatExactUnits(units) : undefined}
  >
    {formatUnits(units)}
  </span>
);
