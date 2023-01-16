import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import StatusBoxRow from '../statusBoxRow';
import { usePendingApplications } from '../../../common/apiHooks';
import { Application, ApplicationType, Conversion, SourceFund } from '../../../common/apiModels';
import { State } from '../../../../types';
import Percentage from '../../../common/Percentage/Percentage';
import { getWeightedAverageFee } from '../../AccountStatement/fundSelector';

interface Props {
  loading: boolean;
  conversion: Conversion;
  secondPillarFunds: SourceFund[];
  secondPillarPikNumber: string;
  secondPillarActive: boolean;
}

export const SecondPillarStatusBox: React.FC<Props> = ({
  loading,
  conversion,
  secondPillarFunds,
  secondPillarPikNumber,
  secondPillarActive,
}: Props) => {
  if (!secondPillarActive) {
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
  const weightedAverageFee = getWeightedAverageFee(secondPillarFunds);
  const activeFund = secondPillarFunds.find((fund) => fund.activeFund)!;
  function ActiveFund() {
    return (
      <>
        {activeFund.name.replaceAll(' ', '\u00a0')} (
        <Percentage value={activeFund.ongoingChargesFigure} />)
      </>
    );
  }

  const isPartiallyConverted = conversion.selectionPartial || conversion.transfersPartial;
  if (!isPartiallyConverted) {
    if (weightedAverageFee > 0.005) {
      return (
        <StatusBoxRow
          error
          showAction={!loading}
          name={<FormattedMessage id="account.status.choice.pillar.second" />}
          lines={[
            <>
              <FormattedMessage id="account.status.choice.highFee.label" />: <ActiveFund />
            </>,
          ]}
        >
          <Link to="/2nd-pillar-flow" className="btn btn-primary">
            <FormattedMessage id="account.status.choice.join.tuleva.2" />
          </Link>
        </StatusBoxRow>
      );
    }
    return (
      <StatusBoxRow
        ok
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.second" />}
        lines={[
          <>
            <FormattedMessage id="account.status.choice.lowFee.label" />: <ActiveFund />
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
    return (
      <StatusBoxRow
        error
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.second" />}
        lines={[<FormattedMessage id="account.status.choice.pillar.second.transferIncomplete" />]}
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
          <FormattedMessage id="account.status.choice.lowFee.index.label" />: <ActiveFund />
        </>,
      ]}
    />
  );
};

const usePendingWithdrawalApplication = (): Application | undefined =>
  usePendingApplications().data?.find(
    (application) =>
      application.type === ApplicationType.WITHDRAWAL ||
      application.type === ApplicationType.EARLY_WITHDRAWAL,
  );

const mapStateToProps = (state: State) => ({
  loading: state.login.loadingUserConversion,
  conversion: state.login.userConversion.secondPillar,
  secondPillarFunds: state.exchange.sourceFunds,
  secondPillarPikNumber: state.login.user.secondPillarPikNumber,
  secondPillarActive: state.login.user.secondPillarActive,
});

export default connect(mapStateToProps)(SecondPillarStatusBox);
