import { ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { CurrencyInput } from '../../common/input/CurrencyInput';
import { formatAmountForCount } from '../../common/utils';
import { PaymentRate } from '../secondPillarPaymentRate/types';
import { rejoinContributions } from './rejoinContributions';

const bold = (chunks: ReactNode) => <b>{chunks}</b>;

const euros = (amount: number) => `${formatAmountForCount(Math.round(amount), 0)} €`;

const signedEuros = (amount: number) =>
  `${formatAmountForCount(Math.round(amount), 0, { isSigned: true })}\u00A0€`;

const DetailLine = ({ label, value }: { label: ReactNode; value: ReactNode }) => (
  <div className="d-flex justify-content-between gap-3 small text-secondary">
    <span>{label}</span>
    <span className="fw-medium text-nowrap">{value}</span>
  </div>
);

type ResultPairProps = {
  label: ReactNode;
  value: ReactNode;
  detailLabel: ReactNode;
  detailValue: ReactNode;
};

const ResultPair = ({ label, value, detailLabel, detailValue }: ResultPairProps) => (
  <>
    <div className="d-flex justify-content-between align-items-baseline gap-3 text-navy">
      <span className="fs-5 fw-medium">{label}</span>
      <span className="fs-3 fw-bold text-nowrap">{value}</span>
    </div>
    <DetailLine label={detailLabel} value={detailValue} />
  </>
);

type RejoinCalculatorProps = {
  grossSalary: number | undefined;
  onGrossSalaryChange: (grossSalary: number | undefined) => void;
  paymentRate: PaymentRate;
  onStart: () => void;
};

export const RejoinCalculator = ({
  grossSalary,
  onGrossSalaryChange,
  paymentRate,
  onStart,
}: RejoinCalculatorProps) => {
  const { formatMessage } = useIntl();
  const contributions = rejoinContributions(grossSalary ?? 0, paymentRate);

  return (
    <div className="row align-items-center gy-5 gx-xl-5">
      <div className="col-lg-6 text-center text-lg-start text-navy">
        <p className="small fw-bold text-primary text-uppercase mb-3">
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
                    className="mw-100"
                    value={grossSalary}
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
              <ResultPair
                label={<FormattedMessage id="secondPillarRejoin.calculation.intoPillar" />}
                value={
                  <FormattedMessage
                    id="secondPillarRejoin.calculation.perMonth"
                    values={{ amount: signedEuros(contributions.intoPillarPerMonth) }}
                  />
                }
                detailLabel={<FormattedMessage id="secondPillarRejoin.calculation.netSalaryCost" />}
                detailValue={
                  <FormattedMessage
                    id="secondPillarRejoin.calculation.perMonth"
                    values={{ amount: signedEuros(-contributions.netSalaryCostPerMonth) }}
                  />
                }
              />
              <div className="border-top mt-3 pt-3">
                <DetailLine
                  label={<FormattedMessage id="secondPillarRejoin.calculation.tenYears" />}
                  value={euros(contributions.tenYearTotal)}
                />
                <DetailLine
                  label={<FormattedMessage id="secondPillarRejoin.calculation.stateShare" />}
                  value={euros(contributions.tenYearStateShare)}
                />
              </div>
              <button type="button" className="btn btn-primary btn-lg w-100 mt-4" onClick={onStart}>
                <FormattedMessage id="secondPillarRejoin.calculator.start" />
              </button>
            </div>
          </div>
        </div>
        <p className="small text-secondary text-center mt-3 mb-0">
          <FormattedMessage
            id="secondPillarRejoin.calculator.assumption"
            values={{ rate: paymentRate }}
          />
        </p>
      </div>
    </div>
  );
};
