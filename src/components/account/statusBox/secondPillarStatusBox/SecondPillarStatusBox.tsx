import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import StatusBoxRow from '../statusBoxRow';
import { useMandateDeadlines, usePendingApplications } from '../../../common/apiHooks';
import {
  Application,
  ApplicationType,
  Conversion,
  Fund,
  MandateDeadlines,
  SourceFund,
} from '../../../common/apiModels';
import { State } from '../../../../types';
import InfoTooltip from '../../../common/infoTooltip';
import { isTuleva } from '../../../common/utils';
import { getValueSum } from '../../AccountStatement/fundSelector';
import Euro from '../../../common/Euro';
import { formatDateTime, formatDateYear } from '../../../common/dateFormatter';
import deadline from './deadline.svg';
import euro from './euro.svg';
import basket from './basket.svg';
import { isBeforeCancellationDeadline } from '../../ApplicationSection/ApplicationFunctions';
import { SecondPillarPaymentRateTaxWin } from '../../../flows/secondPillarPaymentRate/SecondPillarPaymentRateTaxWin';

export interface Props {
  loading: boolean;
  conversion: Conversion;
  sourceFunds: SourceFund[];
  targetFunds: Fund[];
  secondPillarActive: boolean;
  currentPaymentRate: number;
  pendingPaymentRate: number;
}

export const SecondPillarStatusBox: React.FC<Props> = ({
  loading,
  conversion,
  sourceFunds,
  targetFunds,
  secondPillarActive,
  currentPaymentRate,
  pendingPaymentRate,
}: Props) => {
  const { data: mandateDeadlines } = useMandateDeadlines();
  const { data: applications } = usePendingApplications();

  const leaveApplication: Application | undefined =
    applications &&
    applications.find(
      (application) =>
        application.type === ApplicationType.TRANSFER && isTuleva(application.details.sourceFund),
    );

  if (!secondPillarActive) {
    return (
      <StatusBoxRow
        error
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.second" />}
        lines={[<FormattedMessage id="account.status.choice.pillar.second.missing.label" />]}
      >
        <Link to="/2nd-pillar-flow" className="btn btn-primary">
          <FormattedMessage id="account.status.choice.pillar.second.missing.action" />
        </Link>
      </StatusBoxRow>
    );
  }

  const pendingWithdrawal = usePendingWithdrawalApplication();
  if (conversion.pendingWithdrawal && pendingWithdrawal) {
    return (
      <StatusBoxRow
        error
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.second" />}
        lines={[<FormattedMessage id="account.status.choice.pillar.second.withdraw" />]}
      >
        <Link to={`/applications/${pendingWithdrawal.id}/cancellation`} className="btn btn-primary">
          <FormattedMessage id="account.status.choice.pillar.second.withdraw.cancel" />
        </Link>
      </StatusBoxRow>
    );
  }

  if (conversion.weightedAverageFee > 0.005) {
    return highFee(
      loading,
      conversion,
      sourceFunds,
      targetFunds,
      mandateDeadlines,
      leaveApplication,
    );
  }

  const isFullyConverted = conversion.selectionComplete && conversion.transfersComplete;

  if (currentPaymentRate < 4 && pendingPaymentRate < 4) {
    return (
      <StatusBoxRow
        warning
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.second" />}
        lines={[
          <FormattedMessage id="account.status.choice.pillar.second.tax.benefit.warning" />,
          <small className="text-muted">
            <SecondPillarPaymentRateTaxWin />
          </small>,
        ]}
      >
        <Link to="/2nd-pillar-payment-rate" className="btn btn-primary">
          <FormattedMessage id="account.status.choice.paymentRate.increase" />
        </Link>
      </StatusBoxRow>
    );
  }

  if (!isFullyConverted) {
    return (
      <StatusBoxRow
        ok
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.second" />}
        lines={[
          <FormattedMessage
            id="account.status.choice.lowFee.2.label"
            values={{
              paymentRate: currentPaymentRate,
            }}
          />,
          currentPaymentRate !== pendingPaymentRate ? (
            <small className="text-muted">
              <FormattedMessage
                id="account.status.choice.lowFee.index.2.description"
                values={{
                  paymentRate: pendingPaymentRate,
                  paymentRateFulfillmentDate: formatDateYear(
                    mandateDeadlines?.paymentRateFulfillmentDate,
                  ),
                }}
              />
            </small>
          ) : (
            <></>
          ),
        ]}
      >
        <SecondPillarActionButton
          leaveApplication={leaveApplication}
          className="btn-outline-primary"
        />
      </StatusBoxRow>
    );
  }

  return (
    <StatusBoxRow
      ok
      name={<FormattedMessage id="account.status.choice.pillar.second" />}
      showAction={!loading}
      lines={[
        <FormattedMessage
          id="account.status.choice.lowFee.index.2.label"
          values={{
            paymentRate: currentPaymentRate,
          }}
        />,
        currentPaymentRate !== pendingPaymentRate ? (
          <small className="text-muted">
            <FormattedMessage
              id="account.status.choice.lowFee.index.2.description"
              values={{
                paymentRate: pendingPaymentRate,
                paymentRateFulfillmentDate: formatDateYear(
                  mandateDeadlines?.paymentRateFulfillmentDate,
                ),
              }}
            />
          </small>
        ) : (
          <></>
        ),
      ]}
    />
  );
};

function feeComparison(currentFeesEuro: number, tulevaFeesEuro: number) {
  return (
    <small className="text-muted">
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
    </small>
  );
}

const TinyCard = ({ title, text, img }: { title: JSX.Element; text: JSX.Element; img: string }) => (
  <div className="col-md-4 my-3 my-md-0">
    <div className="d-flex align-items-center">
      <div className="mr-3">
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

function highFee(
  loading: boolean,
  conversion: Conversion,
  sourceFunds: SourceFund[],
  targetFunds: Fund[],
  mandateDeadlines: MandateDeadlines | undefined,
  leaveApplication?: Application | undefined,
) {
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
          ? [feeComparison(currentFeesEuro, tulevaFeesEuro)]
          : []),
      ]}
      extraBottom={
        <div className="card card-primary border-0 mt-3 ml-3 ml-md-5 mr-3 my-2 px-4 py-3">
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
}

const usePendingWithdrawalApplication = (): Application | undefined =>
  usePendingApplications().data?.find(
    (application) =>
      application.type === ApplicationType.WITHDRAWAL ||
      application.type === ApplicationType.EARLY_WITHDRAWAL,
  );

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
});

export default connect(mapStateToProps)(SecondPillarStatusBox);
