import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import StatusBoxRow from '../statusBoxRow';
import { usePendingApplications } from '../../../common/apiHooks';
import { Application, ApplicationType, Conversion, SourceFund } from '../../../common/apiModels';
import { State } from '../../../../types';
import InfoTooltip from '../../../common/infoTooltip';

export interface Props {
  loading: boolean;
  conversion: Conversion;
  secondPillarFunds: SourceFund[];
  secondPillarPikNumber: string | null;
  secondPillarActive: boolean;
}

export const SecondPillarStatusBox: React.FC<Props> = ({
  loading,
  conversion,
  secondPillarFunds,
  secondPillarPikNumber,
  secondPillarActive,
}: Props) => {
  const activeFund = secondPillarFunds.find((fund) => fund.activeFund);

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
      return highFee(loading);
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
      return highFee(loading);
    }
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
          <FormattedMessage id="account.status.choice.lowFee.index.label" />
          <InfoTooltip name="second-pillar-tooltip">
            <FormattedMessage id="account.status.choice.lowFee.description" />
          </InfoTooltip>
        </>,
      ]}
    />
  );
};

function highFee(loading: boolean) {
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
      ]}
    >
      <Link to="/2nd-pillar-flow" className="btn btn-primary">
        <FormattedMessage id="account.status.choice.choose.low.fees" />
      </Link>
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
  secondPillarFunds: state.exchange.sourceFunds,
  secondPillarPikNumber: state.login.user.secondPillarPikNumber,
  secondPillarActive: state.login.user.secondPillarActive,
});

export default connect(mapStateToProps)(SecondPillarStatusBox);
