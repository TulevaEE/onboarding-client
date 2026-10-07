import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Euro } from '../../common/Euro';
import { RejoinContributions } from './rejoinContributions';

const SEGMENTS = [
  {
    key: 'netSalaryCostPerMonth',
    labelId: 'secondPillarTaxWin.chart.fromNetSalary',
    color: '#00AEEA',
    hoverColor: '#0098CC',
  },
  {
    key: 'incomeTaxSavedPerMonth',
    labelId: 'secondPillarTaxWin.chart.fromIncomeTax',
    color: '#FDD835',
    hoverColor: '#E8C41E',
  },
  {
    key: 'statePerMonth',
    labelId: 'secondPillarRejoin.calculation.fromState',
    color: '#52A560',
    hoverColor: '#418C50',
  },
] as const;

type SegmentKey = (typeof SEGMENTS)[number]['key'];

export const ContributionBreakdown = ({
  contributions,
}: {
  contributions: RejoinContributions;
}) => {
  const { formatMessage } = useIntl();
  const [highlighted, setHighlighted] = useState<SegmentKey | null>(null);
  const total = SEGMENTS.reduce((sum, { key }) => sum + contributions[key], 0);
  const highlight = (key: SegmentKey) => ({
    onMouseEnter: () => setHighlighted(key),
    onMouseLeave: () => setHighlighted(null),
  });

  return (
    <div className="mt-2">
      {total > 0 && (
        <div className="d-flex gap-1 rounded-pill overflow-hidden" style={{ height: '0.5rem' }}>
          {SEGMENTS.filter(({ key }) => contributions[key] > 0).map(
            ({ key, color, hoverColor }) => (
              <div
                key={key}
                aria-hidden="true"
                style={{
                  width: `${(contributions[key] / total) * 100}%`,
                  backgroundColor: highlighted === key ? hoverColor : color,
                }}
                {...highlight(key)}
              />
            ),
          )}
        </div>
      )}
      <ul
        className="list-unstyled d-flex flex-wrap justify-content-between column-gap-2 row-gap-1 small text-secondary mt-2 mb-0"
        aria-label={formatMessage({ id: 'secondPillarRejoin.calculation.breakdown' })}
      >
        {SEGMENTS.map(({ key, labelId, color }) => (
          <li
            key={key}
            className={`d-flex align-items-center gap-1 text-nowrap ${
              highlighted === key ? 'text-body' : ''
            }`}
            {...highlight(key)}
          >
            <span
              aria-hidden="true"
              className="rounded-circle flex-shrink-0"
              style={{ width: '0.5rem', height: '0.5rem', backgroundColor: color }}
            />
            <Euro className="fw-medium" amount={contributions[key]} fractionDigits={0} />{' '}
            <FormattedMessage id={labelId} />
          </li>
        ))}
      </ul>
    </div>
  );
};
