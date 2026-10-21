import { ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Euro } from '../../common/Euro';
import { InfoTooltip } from '../../common/infoTooltip/InfoTooltip';
import { RejoinContributions } from './rejoinContributions';
import styles from './ContributionBreakdown.module.scss';

const TAX_WIN_COLOR = 'var(--green)';

const SumRow = ({
  operator,
  label,
  amount,
}: {
  operator: string;
  label: ReactNode;
  amount: ReactNode;
}) => (
  <div className="d-flex align-items-baseline">
    <span aria-hidden="true" className={`fs-3 fw-bold ${styles.operator}`}>
      {operator}
    </span>{' '}
    <span className="flex-grow-1 fs-5 fw-medium">{label}</span>{' '}
    <span className="fs-3 fw-bold">{amount}</span>
  </div>
);

const TenYearLine = ({ label, amount }: { label: ReactNode; amount: number }) => (
  <div className="d-flex justify-content-between gap-3 small text-secondary">
    <span>{label}</span>
    <Euro className="fw-medium" amount={amount} fractionDigits={0} />
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

  return (
    <>
      <ul
        className="list-unstyled d-flex flex-column gap-2 m-0"
        aria-label={formatMessage({ id: 'secondPillarRejoin.calculation.breakdown' })}
      >
        <li className="text-navy">
          <SumRow
            operator=""
            label={<FormattedMessage id="secondPillarRejoin.calculation.fromNetSalary" />}
            amount={<Euro amount={contributions.netSalaryCostPerMonth} fractionDigits={0} />}
          />
        </li>
        <li style={{ color: TAX_WIN_COLOR }}>
          <SumRow
            operator="+"
            label={
              <>
                <FormattedMessage id="secondPillarRejoin.calculation.taxWin" />{' '}
                <InfoTooltip
                  name="rejoin-tax-win-tooltip"
                  className={styles.taxWinInfo}
                  place="top"
                >
                  <dl className={`m-0 ${styles.breakdownTable}`}>
                    <BreakdownRow
                      label={<FormattedMessage id="secondPillarGrowth.tooltip.taxGain" />}
                      amount={contributions.incomeTaxSavedPerMonth}
                    />
                    <BreakdownRow
                      label={<FormattedMessage id="secondPillarGrowth.tooltip.socialTax" />}
                      amount={contributions.statePerMonth}
                    />
                  </dl>
                </InfoTooltip>
              </>
            }
            amount={<Euro amount={contributions.taxWinPerMonth} fractionDigits={0} />}
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
      <div className={`mt-3 ${styles.besideOperator}`}>
        <TenYearLine
          label={<FormattedMessage id="secondPillarRejoin.calculation.tenYears" />}
          amount={contributions.tenYearTotal}
        />
      </div>
    </>
  );
};
