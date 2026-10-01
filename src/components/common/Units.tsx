import { FormattedMessage } from 'react-intl';
import { formatExactUnits, formatUnits, isRoundedUnits } from './fundPrecision';
import { PII_CLASS } from '../tracking/piiMarkup';
import styles from './Units.module.scss';

export const Units = ({ units }: { units: number }) => (
  <span
    className={`text-nowrap ${PII_CLASS}`}
    title={isRoundedUnits(units) ? formatExactUnits(units) : undefined}
  >
    {formatUnits(units)}
  </span>
);

export const UnitsRoundingNote = ({
  units,
  printed = false,
  className = '',
}: {
  units: number[];
  printed?: boolean;
  className?: string;
}) =>
  units.some(isRoundedUnits) ? (
    <p className={`text-body-secondary small text-pretty ${className}`}>
      <FormattedMessage id={printed ? 'units.roundingNote.printed' : 'units.roundingNote.screen'} />
      {!printed && (
        <span className={styles.forPointers}>
          {' '}
          <FormattedMessage id="units.roundingNote.hover" />
        </span>
      )}
    </p>
  ) : null;
