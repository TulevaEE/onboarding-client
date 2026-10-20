import { ReactNode, useState } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FormattedMessage, useIntl } from 'react-intl';
import { Euro } from '../../common/Euro';
import { RejoinContributions } from './rejoinContributions';
import styles from './ContributionBreakdown.module.scss';

const NET_SALARY_COLOR = 'var(--blue)';
const TAX_WIN_COLOR = 'var(--green)';
const TAX_WIN_HOVER_COLOR = '#00A100';

const SumRow = ({
  operator,
  label,
  labelElementId,
  amount,
}: {
  operator: string;
  label: ReactNode;
  labelElementId?: string;
  amount: ReactNode;
}) => (
  <div className="d-flex align-items-baseline">
    <span aria-hidden="true" className={`fs-3 fw-bold text-navy ${styles.operator}`}>
      {operator}
    </span>{' '}
    <span id={labelElementId} className="flex-grow-1 fs-5 fw-medium">
      {label}
    </span>{' '}
    <span className="fs-3 fw-bold">{amount}</span>
  </div>
);

const BreakdownRow = ({ label, amount }: { label: ReactNode; amount: number }) => (
  <>
    <dt className="fw-normal">{label}:</dt>{' '}
    <dd className="m-0 text-end">
      <Euro amount={amount} fractionDigits={0} />
    </dd>{' '}
  </>
);

export const ContributionBreakdown = ({
  contributions,
}: {
  contributions: RejoinContributions;
}) => {
  const { formatMessage } = useIntl();
  const [isTaxWinHovered, setTaxWinHovered] = useState(false);

  return (
    <>
      <ul
        className="list-unstyled d-flex flex-column gap-2 m-0"
        aria-label={formatMessage({ id: 'secondPillarRejoin.calculation.breakdown' })}
      >
        <li style={{ color: NET_SALARY_COLOR }}>
          <SumRow
            operator=""
            label={<FormattedMessage id="secondPillarRejoin.calculation.fromNetSalary" />}
            amount={<Euro amount={contributions.netSalaryCostPerMonth} fractionDigits={0} />}
          />
        </li>
        <li style={{ color: TAX_WIN_COLOR }}>
          <SumRow
            operator="+"
            label={<FormattedMessage id="secondPillarRejoin.calculation.taxWin" />}
            labelElementId="rejoin-tax-win-label"
            amount={
              <OverlayTrigger
                placement="right"
                overlay={
                  <Tooltip id="rejoin-tax-win-breakdown" className={styles.breakdown}>
                    <dl className={`m-0 text-start ${styles.breakdownTable}`}>
                      <BreakdownRow
                        label={<FormattedMessage id="secondPillarGrowth.tooltip.taxGain" />}
                        amount={contributions.incomeTaxSavedPerMonth}
                      />
                      <BreakdownRow
                        label={<FormattedMessage id="secondPillarGrowth.tooltip.socialTax" />}
                        amount={contributions.statePerMonth}
                      />
                    </dl>
                  </Tooltip>
                }
              >
                <button
                  type="button"
                  id="rejoin-tax-win-amount"
                  aria-labelledby="rejoin-tax-win-label rejoin-tax-win-amount"
                  className={`btn p-0 border-0 align-baseline fs-3 fw-bold ${styles.withBreakdown}`}
                  style={{ color: isTaxWinHovered ? TAX_WIN_HOVER_COLOR : TAX_WIN_COLOR }}
                  onMouseEnter={() => setTaxWinHovered(true)}
                  onMouseLeave={() => setTaxWinHovered(false)}
                >
                  <Euro amount={contributions.taxWinPerMonth} fractionDigits={0} />
                </button>
              </OverlayTrigger>
            }
          />
        </li>
      </ul>
      <div className="border-top mt-2 pt-2 text-navy">
        <SumRow
          operator="="
          label={<FormattedMessage id="secondPillarRejoin.calculation.intoPillar" />}
          amount={<Euro amount={contributions.intoPillarPerMonth} fractionDigits={0} />}
        />
      </div>
    </>
  );
};
