import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import StatusBoxRow from '../statusBoxRow';
import { usePendingApplications } from '../../../common/apiHooks';
import { Application, ApplicationType, Conversion, SourceFund } from '../../../common/apiModels';
import { State } from '../../../../types';

interface Props {
  loading: boolean;
  secondPillar: Conversion;
  secondPillarFunds: SourceFund[];
  secondPillarPikNumber: string;
}

export const SecondPillarStatusBox: React.FC<Props> = ({
  loading,
  secondPillar,
  secondPillarFunds,
  secondPillarPikNumber,
}: Props) => {
  const pendingWithdrawal = usePendingWithdrawalApplication();

  if (secondPillar.pendingWithdrawal && pendingWithdrawal) {
    return (
      <StatusBoxRow
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

  const activeFund = secondPillarFunds.find((fund) => fund.activeFund);
  if (!secondPillar.selectionComplete || !activeFund) {
    const statusMessage = activeFund ? (
      activeFund.name
    ) : (
      <FormattedMessage id="account.status.choice.pillar.second.missing" />
    );

    return (
      <StatusBoxRow
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.second" />}
        lines={[statusMessage]}
      >
        <Link to="/2nd-pillar-flow" className="btn btn-primary">
          <FormattedMessage id="account.status.choice.join.tuleva.2" />
        </Link>
      </StatusBoxRow>
    );
  }

  if (!secondPillar.transfersComplete) {
    return (
      <StatusBoxRow
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
      lines={[activeFund.name]}
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
  secondPillar: state.login.userConversion.secondPillar,
  secondPillarFunds: state.exchange.sourceFunds,
  secondPillarPikNumber: state.login.user.secondPillarPikNumber,
});

export default connect(mapStateToProps)(SecondPillarStatusBox);
