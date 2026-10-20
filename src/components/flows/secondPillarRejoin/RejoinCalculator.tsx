import { ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { CurrencyInput } from '../../common/input/CurrencyInput';
import { PII_CLASS } from '../../tracking/piiMarkup';
import { PaymentRate } from '../secondPillarPaymentRate/types';
import { rejoinContributions } from './rejoinContributions';
import { ContributionBreakdown } from './ContributionBreakdown';

const MAX_GROSS_SALARY = 99999;

const bold = (chunks: ReactNode) => <b>{chunks}</b>;

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
                    onChange={(salary) =>
                      onGrossSalaryChange(
                        salary === undefined ? undefined : Math.min(salary, MAX_GROSS_SALARY),
                      )
                    }
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
              <ContributionBreakdown contributions={contributions} />
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
