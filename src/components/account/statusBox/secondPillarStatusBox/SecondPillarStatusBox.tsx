/* eslint-disable react/no-unused-prop-types */
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import StatusBoxRow from '../statusBoxRow';
import {
  useFundPensionStatus,
  useMandateDeadlines,
  usePendingApplications,
} from '../../../common/apiHooks';
import {
  Application,
  Conversion,
  Fund,
  MandateDeadlines,
  SourceFund,
} from '../../../common/apiModels';
import { State } from '../../../../types';
import { InfoTooltip } from '../../../common/infoTooltip/InfoTooltip';
import { isTuleva } from '../../../common/utils';
import { getValueSum } from '../../AccountStatement/fundSelector';
import { Euro } from '../../../common/Euro';
import { formatDate, formatDateTime, formatDateYear } from '../../../common/dateFormatter';
import deadline from './deadline.svg';
import euro from './euro.svg';
import basket from './basket.svg';
import { isBeforeCancellationDeadline } from '../../ApplicationSection/ApplicationFunctions';
import { SecondPillarPaymentRateTaxWin } from '../../../flows/secondPillarPaymentRate/SecondPillarPaymentRateTaxWin';
import { ActiveFundPensionDescription } from '../ActiveFundPensionDescription';
import { FundPension } from '../../../common/apiModels/withdrawals';

export interface Props {
  loading: boolean;
  conversion: Conversion;
  sourceFunds: SourceFund[];
  targetFunds: Fund[];
  secondPillarActive: boolean;
  currentPaymentRate: number;
  pendingPaymentRate: number;
  activeFundIsin: string | undefined;
}

type RowProps = {
  loading: boolean;
  conversion: Conversion;
  currentPaymentRate: number;
  pendingPaymentRate: number;
  sourceFunds: SourceFund[];
  targetFunds: Fund[];
  mandateDeadlines: MandateDeadlines | undefined;
  leaveApplication?: Application | undefined;
};

export const SecondPillarStatusBox: React.FC<Props> = ({
  loading,
  conversion,
  sourceFunds,
  targetFunds,
  secondPillarActive,
  currentPaymentRate,
  pendingPaymentRate,
  activeFundIsin,
}: Props) => {
  // TODO improve loading state handling here
  const { data: mandateDeadlines } = useMandateDeadlines();
  const { data: applications } = usePendingApplications();
  const { data: fundPensionStatus } = useFundPensionStatus();

  const leaveApplication: Application | undefined =
    applications &&
    applications.find(
      (application) => application.type === 'TRANSFER' && isTuleva(application.details.sourceFund),
    );

  const rowProps: RowProps = {
    loading,
    conversion,
    sourceFunds,
    currentPaymentRate,
    pendingPaymentRate,
    targetFunds,
    mandateDeadlines,
    leaveApplication,
  };

  if (!secondPillarActive) {
    return <SecondPillarMissing {...rowProps} />;
  }

  if (conversion.pendingWithdrawal) {
    return <PendingPartialWithdrawalOrFundPension {...rowProps} />;
  }

  const activeSecondPillarFundPension = fundPensionStatus?.fundPensions.find(
    (fundPension) => fundPension.active && fundPension.pillar === 'SECOND',
  );

  if (activeSecondPillarFundPension) {
    return <ActiveFundPension fundPension={activeSecondPillarFundPension} />;
  }

  if (conversion.weightedAverageFee > 0.005) {
    return <HighFee {...rowProps} />;
  }

  if ((currentPaymentRate < 4 && pendingPaymentRate < 4) || pendingPaymentRate < 4) {
    return <IncreasePaymentRate {...rowProps} />;
  }

  const isFullyConvertedToTuleva = conversion.selectionComplete && conversion.transfersComplete;

  if (!isFullyConvertedToTuleva) {
    return <InLowFeeFund {...rowProps} />;
  }

  const TULEVA_2ND_PILLAR_BOND_FUND_ISIN = 'EE3600109443';
  if (activeFundIsin === TULEVA_2ND_PILLAR_BOND_FUND_ISIN) {
    return <FullyConvertedToTulevaBonds {...rowProps} />;
  }

  return <FullyConvertedToTuleva {...rowProps} />;
};

const PaymentRateSubRow = ({
  currentPaymentRate,
  futurePaymentRate,
  paymentRateFulfillmentDate,
}: {
  currentPaymentRate: number;
  futurePaymentRate: number;
  paymentRateFulfillmentDate: string;
}) => {
  if (currentPaymentRate !== futurePaymentRate) {
    return (
      <span className="text-body-secondary">
        <FormattedMessage
          id="account.status.choice.futurePaymentRate"
          values={{
            currentPaymentRate,
            futurePaymentRate,
            paymentRateFulfillmentDate: formatDateYear(paymentRateFulfillmentDate),
          }}
        />
      </span>
    );
  }

  return (
    <span className="text-body-secondary">
      <FormattedMessage
        id="account.status.choice.paymentRate"
        values={{
          currentPaymentRate,
        }}
      />
    </span>
  );
};

const FeeComparison = ({
  currentFeesEuro,
  tulevaFeesEuro,
}: {
  currentFeesEuro: number;
  tulevaFeesEuro: number;
}) => (
  <span className="text-body-secondary">
    <FormattedMessage
      id="account.status.choice.highFee.comment"
      values={{
        currentFeesEuro: (
          <Euro amount={currentFeesEuro} className="text-danger" fractionDigits={0} />
        ),
        tulevaFeesEuro: (
          <Euro amount={tulevaFeesEuro} className="text-success" fractionDigits={0} />
        ),
      }}
    />
  </span>
);

const TinyCard = ({ title, text, img }: { title: JSX.Element; text: JSX.Element; img: string }) => (
  <div className="col-md-4 my-3 my-md-0">
    <div className="d-flex align-items-center">
      <div className="me-3">
        <img width={36} src={img} alt="" />
      </div>
      <div>
        <h5 className="card-title mb-1">{title}</h5>
        <small className="card-text">{text}</small>
      </div>
    </div>
  </div>
);

function SecondPillarActionButton({
  leaveApplication,
  className,
}: {
  leaveApplication: Application | undefined;
  className: string;
}) {
  return (
    <>
      {leaveApplication && isBeforeCancellationDeadline(leaveApplication) ? (
        <Link
          to={`/applications/${leaveApplication.id}/cancellation`}
          className={`btn ${className}`}
        >
          <FormattedMessage id="account.status.choice.cancel.application" />
        </Link>
      ) : (
        <Link to="/2nd-pillar-flow" className={`btn ${className}`}>
          <FormattedMessage id="account.status.choice.bring.to.tuleva" />
        </Link>
      )}
    </>
  );
}

const PendingPartialWithdrawalOrFundPension = ({ loading, mandateDeadlines }: RowProps) => {
  const pendingEarlyWithdrawal = usePendingEarlyWithdrawalApplication();
  const pendingPartialWithdrawal = usePendingPartialWithdrawalApplication();
  const pendingFundPensionOpening = usePendingFundPensionOpeningApplication();

  if (pendingEarlyWithdrawal) {
    return (
      <StatusBoxRow
        error
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.second" />}
        lines={[<FormattedMessage id="account.status.choice.pillar.second.withdraw" />]}
      >
        <Link
          to={`/applications/${pendingEarlyWithdrawal.id}/cancellation`}
          className="btn btn-primary"
        >
          <FormattedMessage id="account.status.choice.pillar.second.withdraw.cancel" />
        </Link>
      </StatusBoxRow>
    );
  }

  if (pendingFundPensionOpening && pendingPartialWithdrawal) {
    return (
      <StatusBoxRow
        warning
        showAction={false}
        name={<FormattedMessage id="account.status.choice.pillar.second" />}
        lines={[
          <FormattedMessage id="account.status.choice.pillar.second.fundPensionOpeningPartialWithdrawal" />,
          <span className="text-body-secondary">
            <FormattedMessage
              id="account.status.choice.pillar.second.withdrawalContributionEndingDisclaimer.plural"
              values={{
                b: (chunks: string) => <b>{chunks}</b>,
                contributionEndDate: formatDate(mandateDeadlines?.secondPillarContributionEndDate),
              }}
            />
          </span>,
        ]}
      />
    );
  }

  if (pendingPartialWithdrawal) {
    return (
      <StatusBoxRow
        warning
        showAction={false}
        name={<FormattedMessage id="account.status.choice.pillar.second" />}
        lines={[
          <FormattedMessage id="account.status.choice.pillar.second.partialWithdrawal" />,
          <span className="text-body-secondary">
            <FormattedMessage
              id="account.status.choice.pillar.second.withdrawalContributionEndingDisclaimer.singular"
              values={{
                b: (chunks: string) => <b>{chunks}</b>,
                contributionEndDate: formatDate(mandateDeadlines?.secondPillarContributionEndDate),
              }}
            />
          </span>,
        ]}
      />
    );
  }

  if (pendingFundPensionOpening) {
    return (
      <StatusBoxRow
        warning
        showAction={false}
        name={<FormattedMessage id="account.status.choice.pillar.second" />}
        lines={[
          <FormattedMessage id="account.status.choice.pillar.second.fundPensionOpening" />,
          <span className="text-body-secondary">
            <FormattedMessage
              id="account.status.choice.pillar.second.withdrawalContributionEndingDisclaimer.singular"
              values={{
                b: (chunks: string) => <b>{chunks}</b>,
                contributionEndDate: formatDate(mandateDeadlines?.secondPillarContributionEndDate),
              }}
            />
          </span>,
        ]}
      />
    );
  }

  return null;
};

const ActiveFundPension = ({ fundPension }: { fundPension: FundPension }) => (
  <StatusBoxRow
    ok
    name={<FormattedMessage id="account.status.choice.pillar.second" />}
    showAction={false}
    lines={[
      <FormattedMessage id="account.status.choice.pillar.second.fundPension.active" />,
      <ActiveFundPensionDescription fundPension={fundPension} />,
    ]}
  />
);

const HighFee = ({
  loading,
  conversion,
  sourceFunds,
  targetFunds,
  mandateDeadlines,
  leaveApplication,
}: RowProps) => {
  const value = getValueSum(sourceFunds);
  const currentFeesEuro = conversion.weightedAverageFee * value;
  const tulevaTargetFunds =
    targetFunds && targetFunds.length && targetFunds.filter((fund) => isTuleva(fund));
  const defaultTargetFund =
    tulevaTargetFunds && tulevaTargetFunds.length ? tulevaTargetFunds[0] : null;
  const tulevaFeesPercent = defaultTargetFund?.ongoingChargesFigure || 0;
  const tulevaFeesEuro = tulevaFeesPercent * value;

  return (
    <StatusBoxRow
      error
      showAction={!loading}
      name={<FormattedMessage id="account.status.choice.pillar.second" />}
      lines={[
        <>
          <FormattedMessage id="account.status.choice.highFee.label" />
          <InfoTooltip name="second-pillar-tooltip">
            <FormattedMessage id="account.status.choice.highFee.description" />
          </InfoTooltip>
        </>,
        ...(currentFeesEuro >= 0.5 && tulevaFeesEuro >= 0.5 && currentFeesEuro - tulevaFeesEuro >= 1
          ? [<FeeComparison currentFeesEuro={currentFeesEuro} tulevaFeesEuro={tulevaFeesEuro} />]
          : []),
      ]}
      extraBottom={
        <div className="card card-primary border-0 mt-3 ms-3 ms-md-5 me-3 my-2 px-4 py-3">
          <div className="row">
            <TinyCard
              img={euro}
              title={<FormattedMessage id="account.status.choice.pillar.second.feecard.title" />}
              text={
                <FormattedMessage
                  id="account.status.choice.pillar.second.feecard.text"
                  values={{
                    b: (chunks: string) => <b>{chunks}</b>,
                  }}
                />
              }
            />
            <TinyCard
              img={basket}
              title={<FormattedMessage id="account.status.choice.pillar.second.basketcard.title" />}
              text={
                <>
                  <FormattedMessage
                    id="account.status.choice.pillar.second.basketcard.text"
                    values={{
                      b: (chunks: string) => <b>{chunks}</b>,
                    }}
                  />
                  <InfoTooltip name="diversification-tooltip">
                    <FormattedMessage id="account.status.choice.pillar.second.basketcard.tooltip" />
                  </InfoTooltip>
                </>
              }
            />
            <TinyCard
              img={deadline}
              title={
                <FormattedMessage id="account.status.choice.pillar.second.deadlinecard.title" />
              }
              text={
                <FormattedMessage
                  id="account.status.choice.pillar.second.deadlinecard.text"
                  values={{
                    periodEnding: formatDateTime(mandateDeadlines?.periodEnding),
                    b: (chunks: string) => <b className="text-nowrap">{chunks}</b>,
                  }}
                />
              }
            />
          </div>
        </div>
      }
    >
      <SecondPillarActionButton leaveApplication={leaveApplication} className="btn-primary" />
    </StatusBoxRow>
  );
};

const usePendingEarlyWithdrawalApplication = (): Application | undefined =>
  usePendingApplications().data?.find(
    (application) => application.type === 'WITHDRAWAL' || application.type === 'EARLY_WITHDRAWAL',
  );

const usePendingPartialWithdrawalApplication = (): Application | undefined =>
  usePendingApplications().data?.find((application) => application.type === 'PARTIAL_WITHDRAWAL');

const usePendingFundPensionOpeningApplication = (): Application | undefined =>
  usePendingApplications().data?.find((application) => application.type === 'FUND_PENSION_OPENING');

const mapStateToProps = (state: State) => ({
  loading: state.login.loadingUserConversion,
  conversion: state.login.userConversion.secondPillar,
  sourceFunds: state.exchange.sourceFunds || [],
  targetFunds: state.exchange.targetFunds || [],
  secondPillarActive: (state.login.user || {}).secondPillarActive,
  currentPaymentRate: (state.login.user || {}).secondPillarPaymentRates.current || 2,
  pendingPaymentRate:
    (state.login.user || {}).secondPillarPaymentRates.pending ||
    (state.login.user || {}).secondPillarPaymentRates.current ||
    2,
  activeFundIsin: state.exchange.sourceFunds?.find((sourceFund) => sourceFund.activeFund)?.isin,
});

const SecondPillarMissing = ({ loading }: RowProps) => (
  <StatusBoxRow
    error
    showAction={!loading}
    name={<FormattedMessage id="account.status.choice.pillar.second" />}
    lines={[<FormattedMessage id="account.status.choice.pillar.second.missing.label" />]}
  >
    {/* People who left the 2nd pillar can't rejoin for 10 years, so a CTA might be misleading */}
    {/* <Link to="/2nd-pillar-flow" className="btn btn-primary"> */}
    {/*  <FormattedMessage id="account.status.choice.pillar.second.missing.action" /> */}
    {/* </Link> */}
  </StatusBoxRow>
);

const IncreasePaymentRate = ({ loading }: RowProps) => (
  <StatusBoxRow
    warning
    showAction={!loading}
    name={<FormattedMessage id="account.status.choice.pillar.second" />}
    lines={[
      <FormattedMessage id="account.status.choice.pillar.second.tax.benefit.warning" />,
      <span className="text-body-secondary">
        <SecondPillarPaymentRateTaxWin />
      </span>,
    ]}
  >
    <Link to="/2nd-pillar-payment-rate" className="btn btn-primary">
      <FormattedMessage id="account.status.choice.paymentRate.increase" />
    </Link>
  </StatusBoxRow>
);

const FullyConvertedToTulevaBonds = ({
  loading,
  currentPaymentRate,
  pendingPaymentRate,
  mandateDeadlines,
}: RowProps) => (
  <StatusBoxRow
    warning
    name={<FormattedMessage id="account.status.choice.pillar.second" />}
    showAction={!loading}
    lines={[
      <>
        <FormattedMessage id="account.status.choice.tulevaBondFund.index.label" />
        <InfoTooltip name="bonds-fund-tooltip">
          <>
            <p className="m-0 fw-bold">
              <FormattedMessage id="target.funds.EE3600109443.title" />
            </p>
            <p className="m-0 mt-2">
              <FormattedMessage id="target.funds.EE3600109443.description" />
            </p>
            <p className="m-0 mt-2">
              <FormattedMessage id="target.funds.EE3600109443.description.2" />
            </p>
          </>
        </InfoTooltip>
      </>,
      <PaymentRateSubRow
        currentPaymentRate={currentPaymentRate}
        futurePaymentRate={pendingPaymentRate}
        paymentRateFulfillmentDate={mandateDeadlines?.paymentRateFulfillmentDate ?? ''}
      />,
    ]}
  >
    <Link to="/2nd-pillar-flow" className="btn btn-outline-primary">
      <FormattedMessage id="account.status.choice.choose.stock.fund" />
    </Link>
  </StatusBoxRow>
);

const FullyConvertedToTuleva = ({
  loading,
  currentPaymentRate,
  pendingPaymentRate,
  mandateDeadlines,
}: RowProps) => (
  <StatusBoxRow
    ok
    name={<FormattedMessage id="account.status.choice.pillar.second" />}
    showAction={!loading}
    lines={[
      <FormattedMessage id="account.status.choice.lowFee.index.label" />,
      <PaymentRateSubRow
        currentPaymentRate={currentPaymentRate}
        futurePaymentRate={pendingPaymentRate}
        paymentRateFulfillmentDate={mandateDeadlines?.paymentRateFulfillmentDate ?? ''}
      />,
    ]}
  />
);

const InLowFeeFund = ({
  loading,
  currentPaymentRate,
  pendingPaymentRate,
  mandateDeadlines,
  leaveApplication,
}: RowProps) => (
  <StatusBoxRow
    ok
    showAction={!loading}
    name={<FormattedMessage id="account.status.choice.pillar.second" />}
    lines={[
      <FormattedMessage id="account.status.choice.lowFee.label" />,
      <PaymentRateSubRow
        currentPaymentRate={currentPaymentRate}
        futurePaymentRate={pendingPaymentRate}
        paymentRateFulfillmentDate={mandateDeadlines?.paymentRateFulfillmentDate ?? ''}
      />,
    ]}
  >
    <SecondPillarActionButton leaveApplication={leaveApplication} className="btn-outline-primary" />
  </StatusBoxRow>
);

export default connect(mapStateToProps)(SecondPillarStatusBox);
