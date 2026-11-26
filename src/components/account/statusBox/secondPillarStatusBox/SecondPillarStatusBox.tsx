/* eslint-disable react/no-unused-prop-types */
import React, { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import StatusBoxRow from '../statusBoxRow';
import {
  useFundPensionStatus,
  useMandateDeadlines,
  usePendingApplications,
  useRejoinPermission,
} from '../../../common/apiHooks';
import {
  Application,
  ApplicationType,
  Conversion,
  Fund,
  MandateDeadlines,
  RejoinPermission,
  SecondPillarContributions,
  SourceFund,
} from '../../../common/apiModels';
import { State } from '../../../../types';
import { InfoTooltip } from '../../../common/infoTooltip/InfoTooltip';
import { isTuleva } from '../../../common/utils';
import { getValueSum } from '../../AccountStatement/fundSelector';
import { Euro } from '../../../common/Euro';
import { Shimmer } from '../../../common/shimmer/Shimmer';
import {
  formatDate,
  formatDateFrom,
  formatDateFromWithYear,
  formatDateOnWithYear,
  formatDateUntil,
} from '../../../common/dateFormatter';
import {
  isDateSameOrBeforeCancellationDeadline,
  isRejoinApplication,
} from '../../ApplicationSection/ApplicationFunctions';
import {
  SecondPillarPaymentRateTaxWin,
  TaxWinSentence,
  useSecondPillarTaxWin,
} from '../../../flows/secondPillarPaymentRate/SecondPillarPaymentRateTaxWin';
import { dateToWaitForRejoining } from '../../../flows/secondPillarRejoin/RejoinRefusalReason';
import {
  contributionStartMonth,
  highlightedDeadline,
} from '../../../flows/secondPillarRejoin/deadlineHighlight';
import { ActiveFundPensionDescription } from '../ActiveFundPensionDescription';
import { FundPension } from '../../../common/apiModels/withdrawals';
import { CurrentPaymentRate, PaymentRateSubRow, usePaymentRateChange } from './PaymentRateSubRow';
import { NudgeKey, PaymentRateSeason } from '../../../common/apiModels/nudge';
import { TranslationKey } from '../../../translations';
import styles from './SecondPillarStatusBox.module.scss';

export interface Props {
  loading: boolean;
  conversion: Conversion;
  sourceFunds: SourceFund[];
  targetFunds: Fund[];
  secondPillarActive: boolean;
  secondPillarContributions?: SecondPillarContributions | null;
  currentPaymentRate: number;
  pendingPaymentRate: number;
  activeFundIsin: string | undefined;
  paymentRateSeason?: PaymentRateSeason;
  nudgeKey?: NudgeKey;
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
  paymentRateSeason?: PaymentRateSeason;
  nudgeKey?: NudgeKey;
};

export const SecondPillarStatusBox: React.FC<Props> = ({
  loading,
  conversion,
  sourceFunds,
  targetFunds,
  secondPillarActive,
  secondPillarContributions,
  currentPaymentRate,
  pendingPaymentRate,
  activeFundIsin,
  paymentRateSeason,
  nudgeKey,
}: Props) => {
  // TODO improve loading state handling here
  const { data: mandateDeadlines } = useMandateDeadlines();
  const { data: applications, isInitialLoading: loadingApplications } = usePendingApplications();
  const { data: fundPensionStatus, isInitialLoading: loadingFundPensions } = useFundPensionStatus();

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
    paymentRateSeason,
    nudgeKey,
  };

  const contributing = secondPillarContributions?.contributing;
  const mayNotBeSaving = !secondPillarActive || contributing !== true;
  const applicationsDecideTheRow = mayNotBeSaving || conversion.pendingWithdrawal;
  if (
    (loadingApplications && applicationsDecideTheRow) ||
    (loadingFundPensions && mayNotBeSaving)
  ) {
    return <SecondPillarLoading />;
  }

  const pendingRejoinApplication = applications?.find(isRejoinApplication);
  if (pendingRejoinApplication) {
    return <Rejoined contributionsStartDate={pendingRejoinApplication.details.fulfillmentDate} />;
  }

  const hasStoppedContributing = contributing === false;
  const stoppedContributions = (
    <StoppedContributions
      restartDate={secondPillarContributions?.restartDate}
      rejoinPossibleFrom={secondPillarContributions?.rejoinPossibleFrom}
      loading={loading}
    />
  );

  if (applications?.some(isPendingPayoutApplication)) {
    return <PendingPartialWithdrawalOrFundPension {...rowProps} />;
  }

  const activeSecondPillarFundPension = fundPensionStatus?.fundPensions.find(
    (fundPension) => fundPension.active && fundPension.pillar === 'SECOND',
  );

  if (activeSecondPillarFundPension) {
    return <ActiveFundPension fundPension={activeSecondPillarFundPension} />;
  }

  if (hasStoppedContributing) {
    return stoppedContributions;
  }

  if (!secondPillarActive) {
    return <SecondPillarMissing {...rowProps} />;
  }

  const isFullyConvertedToTuleva = conversion.selectionComplete && conversion.transfersComplete;

  if (!isFullyConvertedToTuleva && conversion.weightedAverageFee >= 0.003) {
    return <HighFee {...rowProps} />;
  }

  if (pendingPaymentRate < 6) {
    return paymentRateSeason ? (
      <SeasonPaymentRateRow {...rowProps} paymentRateSeason={paymentRateSeason} />
    ) : (
      <IncreasePaymentRate {...rowProps} />
    );
  }

  if (!isFullyConvertedToTuleva) {
    return <InLowFeeFund {...rowProps} />;
  }

  const TULEVA_2ND_PILLAR_BOND_FUND_ISIN = 'EE3600109443';
  if (activeFundIsin === TULEVA_2ND_PILLAR_BOND_FUND_ISIN) {
    return <FullyConvertedToTulevaBonds {...rowProps} />;
  }

  return paymentRateSeason ? (
    <SeasonPaymentRateRow {...rowProps} paymentRateSeason={paymentRateSeason} />
  ) : (
    <FullyConvertedToTuleva {...rowProps} />
  );
};

type SeasonRowState = 'raise' | 'maximum' | 'pendingRaise' | 'pendingPartial' | 'pendingDecrease';

type SeasonRow = {
  status: 'SUCCESS' | 'WARNING';
  line1: TranslationKey;
  line2: TranslationKey;
  action?: TranslationKey;
  showsPill?: boolean;
};

const SEASON_ROWS: Record<SeasonRowState, SeasonRow> = {
  raise: {
    status: 'WARNING',
    line1: 'account.status.choice.pillar.second.season.raise.line1',
    line2: 'account.status.choice.pillar.second.season.raise.line2',
    action: 'account.status.choice.paymentRate.increase',
    showsPill: true,
  },
  maximum: {
    status: 'SUCCESS',
    line1: 'account.status.choice.pillar.second.season.maximum.line1',
    line2: 'account.status.choice.pillar.second.season.maximum.line2',
  },
  pendingRaise: {
    status: 'SUCCESS',
    line1: 'account.status.choice.pillar.second.season.pending.line1',
    line2: 'account.status.choice.pillar.second.season.pendingRaise.line2',
  },
  pendingPartial: {
    status: 'WARNING',
    line1: 'account.status.choice.pillar.second.season.pending.line1',
    line2: 'account.status.choice.pillar.second.season.pendingPartial.line2',
    action: 'account.status.choice.paymentRate.increase',
  },
  pendingDecrease: {
    status: 'WARNING',
    line1: 'account.status.choice.pillar.second.season.pendingDecrease.line1',
    line2: 'account.status.choice.pillar.second.season.pendingDecrease.line2',
    action: 'account.status.choice.paymentRate.change',
  },
};

const seasonRowState = (currentPaymentRate: number, pendingPaymentRate: number): SeasonRowState => {
  if (pendingPaymentRate === currentPaymentRate) {
    return currentPaymentRate === 6 ? 'maximum' : 'raise';
  }
  if (pendingPaymentRate < currentPaymentRate) {
    return 'pendingDecrease';
  }
  return pendingPaymentRate === 6 ? 'pendingRaise' : 'pendingPartial';
};

const SeasonPaymentRateRow = ({
  loading,
  currentPaymentRate,
  pendingPaymentRate,
  paymentRateSeason,
}: RowProps & { paymentRateSeason: PaymentRateSeason }) => {
  const { taxWin, loading: loadingTaxWin } = useSecondPillarTaxWin();
  const row = SEASON_ROWS[seasonRowState(currentPaymentRate, pendingPaymentRate)];
  const emphasizeDeadline = paymentRateSeason.mode === 'LAST_DAYS';
  const values = {
    currentPaymentRate,
    pendingPaymentRate,
    deadline: formatDate(paymentRateSeason.deadline),
    deadlineUntil: formatDateUntil(paymentRateSeason.deadline),
    fulfillmentDate: formatDateFrom(paymentRateSeason.fulfillmentDate),
    b: (chunks: string) => (emphasizeDeadline ? <b>{chunks}</b> : <>{chunks}</>),
    hl: (chunks: string) => <span className="text-primary fw-semibold">{chunks}</span>,
  };
  const seasonLine2 = <FormattedMessage id={row.line2} values={values} />;

  return (
    <StatusBoxRow
      status={row.status}
      showAction={!loading}
      name={
        <span className="d-inline-flex flex-wrap align-items-center gap-2">
          <FormattedMessage id="account.status.choice.pillar.second" />
          {row.showsPill && (
            <span className={`${styles.pill} text-nowrap`}>
              <FormattedMessage
                id="account.status.choice.pillar.second.season.pill"
                values={values}
              />
            </span>
          )}
        </span>
      }
      lines={[
        <FormattedMessage id={row.line1} values={values} />,
        loadingTaxWin ? (
          <Shimmer height={24} />
        ) : (
          <span className="text-body-secondary">
            {taxWin === null ? (
              seasonLine2
            ) : (
              <FormattedMessage
                id="account.status.choice.pillar.second.season.withTaxWin"
                values={{
                  taxWin: <TaxWinSentence taxWin={taxWin} placement="OPENS_THE_SENTENCE" />,
                  line2: seasonLine2,
                }}
              />
            )}
          </span>
        ),
      ]}
    >
      {row.action && (
        <Link to="/2nd-pillar-payment-rate" className="btn btn-primary">
          <FormattedMessage id={row.action} />
        </Link>
      )}
    </StatusBoxRow>
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

function SecondPillarActionButton({
  leaveApplication,
  className,
}: {
  leaveApplication: Application | undefined;
  className: string;
}) {
  return (
    <>
      {leaveApplication && isDateSameOrBeforeCancellationDeadline(leaveApplication) ? (
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
        status="ERROR"
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
        status="WARNING"
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
        status="WARNING"
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
        status="WARNING"
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
    status="SUCCESS"
    name={<FormattedMessage id="account.status.choice.pillar.second" />}
    showAction={false}
    lines={[
      <FormattedMessage id="account.status.choice.pillar.second.fundPension.active" />,
      <ActiveFundPensionDescription fundPension={fundPension} />,
    ]}
  />
);

const HighFee = ({ loading, conversion, sourceFunds, targetFunds, leaveApplication }: RowProps) => {
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
      status="WARNING"
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
    >
      <SecondPillarActionButton leaveApplication={leaveApplication} className="btn-primary" />
    </StatusBoxRow>
  );
};

const PAYOUT_APPLICATION_TYPES: ApplicationType[] = [
  'WITHDRAWAL',
  'EARLY_WITHDRAWAL',
  'PARTIAL_WITHDRAWAL',
  'FUND_PENSION_OPENING',
];

const isPendingPayoutApplication = (application: Application) =>
  PAYOUT_APPLICATION_TYPES.includes(application.type);

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
  secondPillarActive: state.login.user?.secondPillarActive,
  secondPillarContributions: state.login.user?.secondPillarContributions,
  currentPaymentRate: state.login.user?.secondPillarPaymentRates?.current ?? 2,
  pendingPaymentRate:
    state.login.user?.secondPillarPaymentRates?.pending ??
    state.login.user?.secondPillarPaymentRates?.current ??
    2,
  activeFundIsin: state.exchange.sourceFunds?.find((sourceFund) => sourceFund.activeFund)?.isin,
});

const SecondPillarLoading = () => (
  <StatusBoxRow
    showAction={false}
    name={<FormattedMessage id="account.status.choice.pillar.second" />}
    lines={[<Shimmer />]}
  />
);

const Rejoined = ({ contributionsStartDate }: { contributionsStartDate: string }) => (
  <StatusBoxRow
    status="SUCCESS"
    showAction={false}
    name={<FormattedMessage id="account.status.choice.pillar.second" />}
    lines={[
      <FormattedMessage
        id="account.status.choice.pillar.second.rejoinPending"
        values={{ date: formatDateOnWithYear(contributionsStartDate) }}
      />,
    ]}
  />
);

const StoppedContributions = ({
  restartDate,
  rejoinPossibleFrom,
  loading,
}: {
  restartDate: string | null | undefined;
  rejoinPossibleFrom: string | null | undefined;
  loading: boolean;
}) =>
  restartDate ? (
    <Rejoined contributionsStartDate={restartDate} />
  ) : (
    <WayBackIn rejoinPossibleFrom={rejoinPossibleFrom} loading={loading} />
  );

const WayBackIn = ({
  rejoinPossibleFrom,
  loading,
}: {
  rejoinPossibleFrom: string | null | undefined;
  loading: boolean;
}) => {
  const { data: rejoinPermission, isInitialLoading: askingWhetherPermitted } =
    useRejoinPermission();
  const { data: mandateDeadlines, isInitialLoading: loadingDeadlines } = useMandateDeadlines();
  const mayRejoin = rejoinPermission?.permitted !== false;

  return (
    <StatusBoxRow
      status="WARNING"
      showAction={!loading && !askingWhetherPermitted && mayRejoin}
      name={<FormattedMessage id="account.status.choice.pillar.second" />}
      lines={[
        <FormattedMessage id="account.status.choice.pillar.second.notContributing.line1" />,
        askingWhetherPermitted || loadingDeadlines ? (
          <Shimmer height={24} />
        ) : (
          <span className="text-body-secondary">
            <WayBackInExplanation
              rejoinPermission={rejoinPermission}
              rejoinPossibleFrom={rejoinPossibleFrom}
              mandateDeadlines={mandateDeadlines}
            />
          </span>
        ),
      ]}
    >
      <Link to="/2nd-pillar-rejoin" className="btn btn-primary">
        <FormattedMessage id="account.status.choice.pillar.second.notContributing.action" />
      </Link>
    </StatusBoxRow>
  );
};

const WayBackInExplanation = ({
  rejoinPermission,
  rejoinPossibleFrom,
  mandateDeadlines,
}: {
  rejoinPermission: RejoinPermission | undefined;
  rejoinPossibleFrom: string | null | undefined;
  mandateDeadlines: MandateDeadlines | undefined;
}) => {
  const rejoinDecision = rejoinPermission?.decision;
  if (rejoinPermission?.permitted === true && mandateDeadlines) {
    return (
      <FormattedMessage
        id="account.status.choice.pillar.second.notContributing.line2.applyByDeadline"
        values={{
          deadline: highlightedDeadline,
          startMonth: contributionStartMonth(
            mandateDeadlines.secondPillarRejoinContributionStartDate,
          ),
        }}
      />
    );
  }
  if (rejoinPermission?.permitted !== false) {
    return (
      <FormattedMessage id="account.status.choice.pillar.second.notContributing.line2.restartsOnceFiled" />
    );
  }
  if (rejoinDecision === 'CONTRIBUTIONS_CANNOT_RESTART') {
    return (
      <FormattedMessage id="account.status.choice.pillar.second.notContributing.line2.contributionsCannotRestart" />
    );
  }
  const waitUntil = dateToWaitForRejoining(rejoinPossibleFrom, rejoinDecision);
  if (waitUntil) {
    return (
      <FormattedMessage
        id="account.status.choice.pillar.second.notContributing.line2.rejoinPossibleFrom"
        values={{ date: formatDateFromWithYear(waitUntil) }}
      />
    );
  }
  return (
    <FormattedMessage id="account.status.choice.pillar.second.notContributing.line2.notPermitted" />
  );
};

const SecondPillarMissing = ({ loading, nudgeKey }: RowProps) => (
  <StatusBoxRow
    status="ERROR"
    showAction={!loading}
    name={<FormattedMessage id="account.status.choice.pillar.second" />}
    lines={[<FormattedMessage id="account.status.choice.pillar.second.missing.label" />]}
  >
    {nudgeKey === 'SECOND_PILLAR_START' && (
      <Link to="/2nd-pillar-flow" className="btn btn-primary">
        <FormattedMessage id="account.status.choice.pillar.second.missing.action" />
      </Link>
    )}
  </StatusBoxRow>
);

const usePaymentRateAndTaxWinLines = (rates: {
  currentPaymentRate: number;
  pendingPaymentRate: number;
}): ReactNode[] => {
  const change = usePaymentRateChange(rates);
  const { taxWin, loading: loadingTaxWin } = useSecondPillarTaxWin();

  if (change.state !== 'NONE') {
    return [
      <span className="text-body-secondary">
        <PaymentRateSubRow {...rates} />
      </span>,
      <span className="text-body-secondary">
        <SecondPillarPaymentRateTaxWin />
      </span>,
    ];
  }

  if (loadingTaxWin) {
    return [<Shimmer height={24} />];
  }

  const currentPaymentRate = <CurrentPaymentRate currentPaymentRate={rates.currentPaymentRate} />;
  return [
    <span className="text-body-secondary">
      {taxWin === null ? (
        currentPaymentRate
      ) : (
        <FormattedMessage
          id="account.status.choice.paymentRate.taxWinCombined"
          values={{
            paymentRate: currentPaymentRate,
            taxWin: <TaxWinSentence taxWin={taxWin} placement="CONTINUES_THE_SENTENCE" />,
          }}
        />
      )}
    </span>,
  ];
};

const IncreasePaymentRate = ({ loading, currentPaymentRate, pendingPaymentRate }: RowProps) => (
  <StatusBoxRow
    status="WARNING"
    showAction={!loading}
    name={<FormattedMessage id="account.status.choice.pillar.second" />}
    lines={[
      <PaymentRateSubRow
        currentPaymentRate={currentPaymentRate}
        pendingPaymentRate={pendingPaymentRate}
      />,
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
}: RowProps) => (
  <StatusBoxRow
    status="WARNING"
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
      <span className="text-body-secondary">
        <PaymentRateSubRow
          currentPaymentRate={currentPaymentRate}
          pendingPaymentRate={pendingPaymentRate}
        />
      </span>,
    ]}
  >
    <Link to="/2nd-pillar-flow" className="btn btn-outline-primary">
      <FormattedMessage id="account.status.choice.choose.stock.fund" />
    </Link>
  </StatusBoxRow>
);

const FullyConvertedToTuleva = ({ loading, currentPaymentRate, pendingPaymentRate }: RowProps) => {
  const paymentRateLines = usePaymentRateAndTaxWinLines({ currentPaymentRate, pendingPaymentRate });
  return (
    <StatusBoxRow
      status="SUCCESS"
      name={<FormattedMessage id="account.status.choice.pillar.second" />}
      showAction={!loading}
      lines={[
        <FormattedMessage id="account.status.choice.lowFee.index.label" />,
        ...paymentRateLines,
      ]}
    />
  );
};

const InLowFeeFund = ({
  loading,
  currentPaymentRate,
  pendingPaymentRate,
  leaveApplication,
}: RowProps) => {
  const paymentRateLines = usePaymentRateAndTaxWinLines({ currentPaymentRate, pendingPaymentRate });
  return (
    <StatusBoxRow
      status="SUCCESS"
      showAction={!loading}
      name={<FormattedMessage id="account.status.choice.pillar.second" />}
      lines={[<FormattedMessage id="account.status.choice.lowFee.label" />, ...paymentRateLines]}
    >
      <SecondPillarActionButton
        leaveApplication={leaveApplication}
        className="btn-outline-primary"
      />
    </StatusBoxRow>
  );
};

export default connect(mapStateToProps)(SecondPillarStatusBox);
