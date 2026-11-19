import React, { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Amount, formatAmount } from './Amount';
import { ThirdPillarTaxHeadroom } from '../../common/apiModels/taxHeadroom';
import { TranslationKey } from '../../translations';
import { headroomFiguresOf } from './headroomFigures';
import styles from './HeadroomMeter.module.scss';

type Props = {
  headroom: ThirdPillarTaxHeadroom;
  planned?: number;
  size?: 'regular' | 'small';
  className?: string;
};

type Segment = {
  amount: number;
  labelId: TranslationKey;
  className: string;
};

const useFillsAfterFirstPaint = () => {
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setFilled(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  return filled;
};

export const HeadroomMeter = ({
  headroom,
  planned = 0,
  size = 'regular',
  className = '',
}: Props) => {
  const { paid } = headroom;
  const { limit, limitIsEstimate } = headroomFiguresOf(headroom);
  const { formatMessage } = useIntl();
  const filled = useFillsAfterFirstPaint();

  const remainingBeforePlanned = Math.max(limit - paid, 0);
  const plannedWithinLimit = Math.min(planned, remainingBeforePlanned);
  const plannedAboveLimit = Math.max(planned - remainingBeforePlanned, 0);
  const scale = Math.max(limit, paid + planned);
  const shareOf = (amount: number) => (amount / scale) * 100;
  const goesOverLimit = scale > limit;

  const segments: Segment[] = [
    { amount: paid, labelId: 'thirdPillarTaxHeadroom.meter.paid', className: styles.paid },
    {
      amount: plannedWithinLimit,
      labelId: 'thirdPillarTaxHeadroom.meter.planned',
      className: styles.planned,
    },
    {
      amount: plannedAboveLimit,
      labelId: 'thirdPillarTaxHeadroom.meter.aboveLimit',
      className: styles.aboveLimit,
    },
  ];

  return (
    <div className={`${styles.meter} ${size === 'small' ? styles.small : ''} ${className}`}>
      <div className={`progress-stacked ${styles.bar}`}>
        {segments
          .filter(({ amount }) => amount > 0)
          .map(({ amount, labelId, className: segmentClassName }) => (
            <div
              key={labelId}
              className={`progress ${styles.segment}`}
              role="progressbar"
              aria-label={formatMessage({ id: labelId })}
              aria-valuetext={formatAmount(amount)}
              aria-valuenow={amount}
              aria-valuemin={0}
              aria-valuemax={limit}
              title={`${formatMessage({ id: labelId })} ${formatAmount(amount)}`}
              style={{ width: filled ? `${shareOf(amount)}%` : '0%' }}
            >
              <div className={`progress-bar ${segmentClassName}`} />
            </div>
          ))}
      </div>
      {goesOverLimit && (
        <div className={styles.limitMark} style={{ left: `${shareOf(limit)}%` }} aria-hidden />
      )}
      <div
        className="d-flex justify-content-between gap-3 mt-2 text-body-secondary"
        style={goesOverLimit ? { width: `${shareOf(limit)}%`, minWidth: '50%' } : undefined}
      >
        <span>
          <FormattedMessage
            id="thirdPillarTaxHeadroom.meter.paidAmount"
            values={{ amount: <Amount amount={paid} className="text-body" /> }}
          />
        </span>
        <span className="text-end">
          <FormattedMessage
            id={
              limitIsEstimate
                ? 'thirdPillarTaxHeadroom.meter.estimatedLimitAmount'
                : 'thirdPillarTaxHeadroom.meter.limitAmount'
            }
            values={{ amount: <Amount amount={limit} className="text-body" /> }}
          />
        </span>
      </div>
    </div>
  );
};
