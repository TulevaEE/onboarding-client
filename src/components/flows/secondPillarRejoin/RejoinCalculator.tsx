import { ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { CurrencyInput } from '../../common/input/CurrencyInput';
import { Euro } from '../../common/Euro';
import { PII_CLASS } from '../../tracking/piiMarkup';
import { PaymentRate } from '../secondPillarPaymentRate/types';
import { rejoinContributions } from './rejoinContributions';
import { ContributionBreakdown } from './ContributionBreakdown';

const bold = (chunks: ReactNode) => <b>{chunks}</b>;

const DetailLine = ({ label, value }: { label: ReactNode; value: ReactNode }) => (
  <div className="d-flex justify-content-between gap-3 small text-secondary">
    <span>{label}</span>
    <span className="fw-medium text-nowrap">{value}</span>
  </div>
);

type RejoinCalculatorProps = {
  grossSalary: number | undefined;
  onGrossSalaryChange: (grossSalary: number | undefined) => void;
  exampleSalary: number;
  paymentRate: PaymentRate;
  onStart: () => void;
};

export const RejoinCalculator = ({
  grossSalary,
  onGrossSalaryChange,
  exampleSalary,
  paymentRate,
  onStart,
}: RejoinCalculatorProps) => {
  const { formatMessage } = useIntl();
  const contributions = rejoinContributions(grossSalary ?? exampleSalary, paymentRate);

  return (
    <div className="row align-items-center gy-5 gx-xl-5">
      <div className="col-lg-6 text-center text-lg-start text-navy">
        <p className="fw-medium text-primary mb-3">
          <FormattedMessage id="secondPillarRejoin.calculator.eyebrow" />
        </p>
        <h1 className="mb-4 text-balance">
          <FormattedMessage id="secondPillarRejoin.heading" />
        </h1>
        <p className="lead m-0 text-balance">
          <FormattedMessage id="secondPillarRejoin.lead" values={{ b: bold }} />
        </p>
      </div>

      <div className="col-lg-6">
        <div className="card rounded-4">
          <div className="card-body p-2">
            <div className="bg-gray-2 p-3 rounded-3">
              <div className="row align-items-center">
                <label htmlFor="rejoin-gross-salary" className="col-sm-6 col-form-label pe-0">
                  <FormattedMessage id="secondPillarRejoin.calculation.salary" />
                </label>
                <div className="col-sm-6">
                  <CurrencyInput
                    id="rejoin-gross-salary"
                    className={`mw-100 ${PII_CLASS}`}
                    value={grossSalary}
                    placeholder={String(exampleSalary)}
                    onChange={onGrossSalaryChange}
                    withEuroSign={false}
                    alignEnd
                  />
                </div>
              </div>
            </div>

            <div
              className="px-3 pt-4 pb-3"
              role="group"
              aria-label={formatMessage({ id: 'secondPillarRejoin.calculation.label' })}
            >
              <div className="d-flex justify-content-between align-items-baseline gap-3 text-navy">
                <span className="fs-5 fw-medium">
                  <FormattedMessage id="secondPillarRejoin.calculation.intoPillar" />
                </span>
                <span className="fs-3 fw-bold text-nowrap">
                  <FormattedMessage
                    id="secondPillarRejoin.calculation.perMonth"
                    values={{
                      amount: <Euro amount={contributions.intoPillarPerMonth} fractionDigits={0} />,
                    }}
                  />
                </span>
              </div>
              <ContributionBreakdown contributions={contributions} />
              <div className="border-top mt-3 pt-3">
                <DetailLine
                  label={<FormattedMessage id="secondPillarRejoin.calculation.tenYears" />}
                  value={<Euro amount={contributions.tenYearTotal} fractionDigits={0} />}
                />
                <DetailLine
                  label={<FormattedMessage id="secondPillarRejoin.calculation.stateShare" />}
                  value={<Euro amount={contributions.tenYearStateShare} fractionDigits={0} />}
                />
              </div>
              <button type="button" className="btn btn-primary btn-lg w-100 mt-4" onClick={onStart}>
                <FormattedMessage id="secondPillarRejoin.calculator.start" />
              </button>
            </div>
          </div>
        </div>
        <p className="small text-secondary text-center mt-3 mb-0">
          <span>
            <FormattedMessage
              id="secondPillarRejoin.calculator.assumption"
              values={{ rate: paymentRate }}
            />
          </span>{' '}
          <span>
            <FormattedMessage id="secondPillarRejoin.firstPillarNote" />
          </span>
        </p>
      </div>
    </div>
  );
};
