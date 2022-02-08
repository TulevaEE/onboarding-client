import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import StatusBoxRow from '../statusBoxRow';
import { usePendingApplications } from '../../../common/apiHooks';
import {
  Application,
  ApplicationType,
  SourceFund,
  UserConversion,
} from '../../../common/apiModels';

interface Props {
  conversion: UserConversion;
  loading: boolean;
  secondPillarFunds: SourceFund[];
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
        name={<FormattedMessage id="account.status.choice.pillar.second" />}
        lines={[<FormattedMessage id="account.status.choice.pillar.second.withdraw" />]}
      >
        <Link to={`/applications/${pendingWithdrawal.id}/cancellation`} className="btn btn-light">
          <FormattedMessage id="account.status.choice.pillar.second.withdraw.cancel" />
        </Link>
      </StatusBoxRow>
    );
  }

  const activeFund = secondPillarFunds.find((fund) => fund.activeFund);
  if (!conversion.secondPillar.selectionComplete || !activeFund) {
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
        <Link to="/2nd-pillar-flow" className="btn btn-light">
          <FormattedMessage id="account.status.choice.join.tuleva.2" />
        </Link>
      </StatusBoxRow>
    );
  }

  if (!conversion.secondPillar.transfersComplete) {
    return (
      <StatusBoxRow
        showAction={!loading}
        name={<FormattedMessage id="account.status.choice.pillar.second" />}
        lines={[<FormattedMessage id="account.status.choice.pillar.second.transferIncomplete" />]}
      >
        <Link to="/2nd-pillar-flow" className="btn btn-light">
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

const mapStateToProps = (state: {
  login: {
    userConversion: UserConversion;
    loadingUserConversion: boolean;
  };
  exchange: { sourceFunds: SourceFund[] };
}) => ({
  conversion: state.login.userConversion,
  loading: state.login.loadingUserConversion,
  secondPillarFunds: state.exchange.sourceFunds,
});

export default connect(mapStateToProps)(SecondPillarStatusBox);
