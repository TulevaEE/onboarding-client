import { ReactNode, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { Loader } from '../../common';
import { useFunds } from '../../common/apiHooks';
import { Fund } from '../../common/apiModels';
import { TulevaSecondPillarStockFund } from '../../common/utils';
import { SuccessNotice } from '../common/SuccessNotice/SuccessNotice';
import { PaymentRate } from '../secondPillarPaymentRate/types';
import { PrototypeBar } from './PrototypeBar';
import { RejoinCalculator } from './RejoinCalculator';
import { FundChoice, PaymentRateChoice } from './RejoinChoices';
import { RejoinDisclaimers } from './RejoinDisclaimers';
import { STATE_CONTRIBUTION_PERCENT } from './rejoinContributions';
import { useView, View } from './variants';

const DEFAULT_GROSS_SALARY = 2000;
const DEFAULT_PAYMENT_RATE: PaymentRate = 6;
const RECOMMENDED_FUND_ISIN: TulevaSecondPillarStockFund = 'EE3600109435';

const bold = (chunks: ReactNode) => <b>{chunks}</b>;

const isOpenForContributions = (fund: Fund) => fund.pillar === 2 && fund.status === 'ACTIVE';

const RejoinHeader = () => (
  <>
    <h1 className="mb-3 text-balance">
      <FormattedMessage id="secondPillarRejoin.heading" />
    </h1>
    <p className="lead mb-5 text-balance">
      <FormattedMessage id="secondPillarRejoin.lead" values={{ b: bold }} />
    </p>
  </>
);

export const SecondPillarRejoin = () => {
  const [view, setView] = useView();
  const { data: funds } = useFunds();
  const [grossSalary, setGrossSalary] = useState<number | undefined>(DEFAULT_GROSS_SALARY);
  const [paymentRate, setPaymentRate] = useState<PaymentRate>(DEFAULT_PAYMENT_RATE);
  const [fundIsin, setFundIsin] = useState<string>(RECOMMENDED_FUND_ISIN);
  const [isPaymentRateOpen, setPaymentRateOpen] = useState(false);
  const [isFundOpen, setFundOpen] = useState(false);
  const [isSubmitted, setSubmitted] = useState(false);

  if (!funds) {
    return <Loader className="align-middle my-4" />;
  }

  const secondPillarFunds = funds.filter(isOpenForContributions);
  const chosenFund = secondPillarFunds.find((fund) => fund.isin === fundIsin) ?? null;

  const changeView = (nextView: View) => {
    setSubmitted(false);
    setView(nextView);
  };

  const startOver = () => {
    setPaymentRate(DEFAULT_PAYMENT_RATE);
    setFundIsin(RECOMMENDED_FUND_ISIN);
    setSubmitted(false);
  };

  return (
    <>
      <div className="col-12 col-md-11 col-lg-8 mx-auto">
        <PrototypeBar view={view} onViewChange={changeView} />
      </div>

      {view === 'calculator' && (
        <RejoinCalculator
          grossSalary={grossSalary}
          onGrossSalaryChange={setGrossSalary}
          paymentRate={DEFAULT_PAYMENT_RATE}
          onStart={() => changeView('application')}
        />
      )}

      <div className="col-12 col-md-11 col-lg-8 mx-auto">
        {view === 'application' && isSubmitted && (
          <RejoinSuccess
            paymentRate={paymentRate}
            chosenFund={chosenFund}
            onStartOver={startOver}
          />
        )}

        {view === 'application' && !isSubmitted && (
          <>
            <RejoinHeader />
            <div className="border-top mb-5">
              <PaymentRateChoice
                paymentRate={paymentRate}
                onChange={setPaymentRate}
                open={isPaymentRateOpen}
                onToggle={() => setPaymentRateOpen(!isPaymentRateOpen)}
              />
              <FundChoice
                funds={secondPillarFunds}
                recommendedFundIsin={RECOMMENDED_FUND_ISIN}
                fundIsin={fundIsin}
                onChange={setFundIsin}
                open={isFundOpen}
                onToggle={() => setFundOpen(!isFundOpen)}
              />
            </div>
            <RejoinDisclaimers className="mb-3" />
            <div className="d-flex flex-column-reverse flex-md-row justify-content-between">
              <Link className="btn btn-light mt-2" to="/account">
                <FormattedMessage id="secondPillarPaymentRate.cancel" />
              </Link>
              <button
                type="button"
                className="btn btn-primary mt-2"
                onClick={() => setSubmitted(true)}
              >
                <FormattedMessage id="secondPillarRejoin.sign" />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

const SummaryItem = ({ label, children }: { label: ReactNode; children: ReactNode }) => (
  <li className="d-flex justify-content-between gap-3 py-2 border-top">
    <span>{label}</span> <b className="text-end">{children}</b>
  </li>
);

const RejoinSuccess = ({
  paymentRate,
  chosenFund,
  onStartOver,
}: {
  paymentRate: PaymentRate;
  chosenFund: Fund | null;
  onStartOver: () => void;
}) => {
  const { formatMessage } = useIntl();

  return (
    <SuccessNotice>
      <h2 className="text-center mt-3">
        <FormattedMessage id="secondPillarRejoin.success.heading" />
      </h2>
      <ul
        className="list-unstyled text-start mx-auto mt-4 mb-0"
        style={{ maxWidth: '26rem' }}
        aria-label={formatMessage({ id: 'secondPillarRejoin.success.summary' })}
      >
        <SummaryItem
          label={<FormattedMessage id="secondPillarRejoin.success.contributionsStart" />}
        >
          <FormattedMessage id="secondPillarRejoin.success.contributionsStartDate" />
        </SummaryItem>
        <SummaryItem label={<FormattedMessage id="secondPillarRejoin.paymentRate.label" />}>
          <FormattedMessage
            id="secondPillarRejoin.paymentRate.value"
            values={{ rate: paymentRate }}
          />
        </SummaryItem>
        <SummaryItem label={<FormattedMessage id="secondPillarRejoin.success.stateAdds" />}>
          <FormattedMessage
            id="secondPillarRejoin.paymentRate.value"
            values={{ rate: STATE_CONTRIBUTION_PERCENT }}
          />
        </SummaryItem>
        {chosenFund && (
          <SummaryItem label={<FormattedMessage id="secondPillarRejoin.fund.label" />}>
            {chosenFund.name}
          </SummaryItem>
        )}
      </ul>
      <button type="button" className="btn btn-outline-primary mt-4" onClick={onStartOver}>
        <FormattedMessage id="secondPillarRejoin.success.startOver" />
      </button>
    </SuccessNotice>
  );
};
