import React from 'react';
import { Message } from 'retranslate';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { StatusBoxRow } from '../statusBoxRow/StatusBoxRow';
import { usePendingApplications } from '../../../common/apiHooks';
import { Application, ApplicationType } from '../../../common/apiModels';
import { Fund, UserConversion } from '../types';

interface Props {
  conversion: UserConversion;
  loading: boolean;
  secondPillarFunds: Fund[];
}

export const SecondPillarStatusBox: React.FunctionComponent<Props> = ({
  conversion,
  loading = false,
  secondPillarFunds = [],
}) => {
  const pendingWithdrawal = usePendingWithdrawalApplication();

  if (conversion.secondPillar.pendingWithdrawal && pendingWithdrawal) {
    return (
      <StatusBoxRow
        showAction={!loading}
        name={<Message>account.status.choice.pillar.second</Message>}
        lines={[<Message>account.status.choice.pillar.second.withdraw</Message>]}
      >
        <Link to={`/applications/${pendingWithdrawal.id}/cancellation`} className="btn btn-light">
          <Message>account.status.choice.pillar.second.withdraw.cancel</Message>
        </Link>
      </StatusBoxRow>
    );
  }

  const activeFund = secondPillarFunds.find((fund) => fund.activeFund);
  if (!conversion.secondPillar.selectionComplete || !activeFund) {
    const statusMessage = activeFund ? (
      activeFund.name
    ) : (
      <Message>account.status.choice.pillar.second.missing</Message>
    );

    return (
      <StatusBoxRow
        showAction={!loading}
        name={<Message>account.status.choice.pillar.second</Message>}
        lines={[statusMessage]}
      >
        <Link to="/2nd-pillar-flow" className="btn btn-light">
          <Message>account.status.choice.join.tuleva.2</Message>
        </Link>
      </StatusBoxRow>
    );
  }

  if (!conversion.secondPillar.transfersComplete) {
    return (
      <StatusBoxRow
        showAction={!loading}
        name={<Message>account.status.choice.pillar.second</Message>}
        lines={[<Message>account.status.choice.pillar.second.transferIncomplete</Message>]}
      >
        <Link to="/2nd-pillar-flow" className="btn btn-light">
          <Message>account.status.choice.transfer.tuleva.2</Message>
        </Link>
      </StatusBoxRow>
    );
  }

  return (
    <StatusBoxRow
      ok
      name={<Message>account.status.choice.pillar.second</Message>}
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

const mapStateToProps = (state: {
  login: {
    userConversion: UserConversion;
    loadingUserConversion: boolean;
  };
  exchange: { sourceFunds: Fund[] };
}) => ({
  conversion: state.login.userConversion,
  loading: state.login.loadingUserConversion,
  secondPillarFunds: state.exchange.sourceFunds,
});

export default connect(mapStateToProps)(SecondPillarStatusBox);
