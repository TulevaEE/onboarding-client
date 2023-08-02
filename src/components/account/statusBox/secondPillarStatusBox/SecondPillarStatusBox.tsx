import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import moment from 'moment';
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
import { formatDate } from '../../../common/dateUtils';

export interface Props {
  loading: boolean;
  conversion: Conversion;
  sourceFunds: SourceFund[];
  targetFunds: Fund[];
  secondPillarPikNumber: string | null;
  secondPillarActive: boolean;
}

export const SecondPillarStatusBox: React.FC<Props> = ({
  loading,
  conversion,
  sourceFunds,
  targetFunds,
  secondPillarPikNumber,
  secondPillarActive,
}: Props) => {
  const activeFund = sourceFunds.find((fund) => fund.activeFund);
  const { data: mandateDeadlines } = useMandateDeadlines();

  if (!secondPillarActive || !activeFund) {
    return (
      <StatusBoxRow
        error
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.second" />}
        lines={[<FormattedMessage id="account.status.choice.pillar.second.missing.label" />]}
      />
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

  if (secondPillarPikNumber) {
    return (
      <StatusBoxRow
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.second" />}
        lines={[
          <FormattedMessage
            id="account.status.choice.pillar.second.pik"
            values={{ secondPillarPikNumber }}
          />,
        ]}
      />
    );
  }

  const isPartiallyConverted = conversion.selectionPartial || conversion.transfersPartial;
  if (!isPartiallyConverted) {
    if (conversion.weightedAverageFee > 0.005) {
      return highFee(loading, conversion, sourceFunds, targetFunds, mandateDeadlines);
    }
    return (
      <StatusBoxRow
        ok
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.second" />}
        lines={[
          <>
            <FormattedMessage id="account.status.choice.lowFee.label" />
            <InfoTooltip name="second-pillar-tooltip">
              <FormattedMessage id="account.status.choice.lowFee.description" />
            </InfoTooltip>
          </>,
        ]}
      >
        <Link to="/2nd-pillar-flow" className="btn btn-light">
          <FormattedMessage id="account.status.choice.join.tuleva.2" />
        </Link>
      </StatusBoxRow>
    );
  }

  const isFullyConverted = conversion.selectionComplete && conversion.transfersComplete;
  if (!isFullyConverted) {
    if (conversion.weightedAverageFee > 0.005) {
      return highFee(loading, conversion, sourceFunds, targetFunds, mandateDeadlines);
    }
    return (
      <StatusBoxRow
        error
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.second" />}
        lines={[
          <FormattedMessage id="account.status.choice.pillar.second.transferIncomplete" />,
          ...(mandateDeadlines && isPeriodEnding(mandateDeadlines)
            ? [periodEndingMessage(mandateDeadlines)]
            : []),
        ]}
      >
        <Link to="/2nd-pillar-flow" className="btn btn-primary">
          <FormattedMessage id="account.status.choice.transfer.tuleva.2" />
        </Link>
      </StatusBoxRow>
    );
  }

  return (
    <StatusBoxRow
      ok
      name={<FormattedMessage id="account.status.choice.pillar.second" />}
      showAction={!loading}
      lines={[
        <>
          <FormattedMessage id="account.status.choice.lowFee.index.label" />
          <InfoTooltip name="second-pillar-tooltip">
            <FormattedMessage id="account.status.choice.lowFee.description" />
          </InfoTooltip>
        </>,
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

function highFee(
  loading: boolean,
  conversion: Conversion,
  sourceFunds: SourceFund[],
  targetFunds: Fund[],
  mandateDeadlines: MandateDeadlines | undefined,
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
        ...(mandateDeadlines && isPeriodEnding(mandateDeadlines)
          ? [periodEndingMessage(mandateDeadlines)]
          : []),
      ]}
    >
      <Link to="/2nd-pillar-flow" className="btn btn-primary">
        <FormattedMessage id="account.status.choice.choose.low.fees" />
      </Link>
    </StatusBoxRow>
  );
}

function isPeriodEnding(mandateDeadlines: MandateDeadlines | undefined) {
  return mandateDeadlines && moment(mandateDeadlines.periodEnding).diff(moment(), 'days') <= 10;
}

function periodEndingMessage(mandateDeadlines: MandateDeadlines) {
  return (
    <small className="text-muted">
      <FormattedMessage
        id="select.sources.select.all.deadline"
        values={{
          periodEnding: formatDate(mandateDeadlines.periodEnding),
          b: (chunks: string) => <b className="text-nowrap">{chunks}</b>,
        }}
      />
    </small>
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
  secondPillarPikNumber: (state.login.user || {}).secondPillarPikNumber,
  secondPillarActive: (state.login.user || {}).secondPillarActive,
});

export default connect(mapStateToProps)(SecondPillarStatusBox);
