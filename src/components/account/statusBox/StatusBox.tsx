import React from 'react';
import { Message } from 'retranslate';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { StatusBoxRow } from './statusBoxRow/StatusBoxRow';
import { usePendingApplications } from '../../common/apiHooks';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { Application, ApplicationType } from '../../common/apiModels';

interface UserConversion {
  secondPillar: Conversion;
  thirdPillar: Conversion;
}

interface Amount {
  yearToDate: number;
  total: number;
}

interface Conversion {
  selectionComplete: boolean;
  transfersComplete: boolean;
  paymentComplete: boolean;
  pendingWithdrawal: boolean;
  contribution: Amount;
  subtraction: Amount;
}

interface Fund {
  fundManager: { name: string };
  activeFund: boolean;
  name: string;
  pillar: number;
}

interface StatusBoxType {
  memberNumber: number | null;
  conversion?: UserConversion;
  loading: boolean;
  secondPillarFunds: Fund[];
  thirdPillarFunds: Fund[];
}

export const StatusBox: React.FunctionComponent<StatusBoxType> = ({
  conversion,
  memberNumber = null,
  loading = false,
  secondPillarFunds = [],
  thirdPillarFunds = [],
}) => {
  if (!conversion || !secondPillarFunds || !thirdPillarFunds) {
    return <StatusBoxLoader />;
  }

  const payTuleva3 = !(
    conversion.thirdPillar.selectionComplete &&
    conversion.thirdPillar.transfersComplete &&
    conversion.thirdPillar.paymentComplete
  );

  const isTulevaMember = memberNumber != null;

  const tulevaData = isTulevaMember
    ? [<Message params={{ memberNumber }}>account.member.statement</Message>]
    : [<Message>account.non.member.statement</Message>];

  const thirdPillarActiveFunds = thirdPillarFunds
    .filter((fund) => fund.activeFund)
    .map(({ name }) => name);

  return (
    <>
      <StatusBoxTitle />

      <div className="card card-secondary">
        {renderSecondPillarFlow(conversion.secondPillar, secondPillarFunds, loading)}

        <StatusBoxRow
          ok={!payTuleva3}
          showAction={!loading}
          name={<Message>account.status.choice.pillar.third</Message>}
          lines={thirdPillarActiveFunds}
        >
          <Link to="/3rd-pillar-flow" className="btn btn-light">
            <Message>account.status.choice.pay.tuleva.3</Message>
          </Link>
        </StatusBoxRow>

        <StatusBoxRow
          last
          ok={isTulevaMember}
          showAction={!loading}
          name={<Message>account.status.choice.tuleva</Message>}
          lines={tulevaData}
        >
          {!isTulevaMember && (
            <Link to="/join" className="btn btn-light">
              <Message>account.status.choice.join.tuleva</Message>
            </Link>
          )}
        </StatusBoxRow>
      </div>
      <div className="mt-3">
        <small className="text-muted">
          <Message
            params={{
              contribution: (conversion.thirdPillar.contribution.yearToDate || 0).toString(),
            }}
            dangerouslyTranslateInnerHTML="account.status.yearToDateContribution"
          />
        </small>
      </div>
    </>
  );
};

const StatusBoxLoader: React.FunctionComponent = () => {
  return (
    <>
      <StatusBoxTitle />
      <div className="card card-secondary">
        <div className="d-flex p-2 status-box-row tv-table__row">
          <Shimmer height={52} />
        </div>
        <div className="d-flex p-2 status-box-row tv-table__row">
          <Shimmer height={52} />
        </div>
        <div className="d-flex p-2 status-box-row">
          <Shimmer height={52} />
        </div>
      </div>
      <div className="mt-4">
        <Shimmer height={16} />
      </div>
    </>
  );
};

const StatusBoxTitle: React.FunctionComponent = () => {
  return (
    <div className="row">
      <div className="col-md-6 mb-4 lead">
        <Message>account.status.choices</Message>
      </div>
    </div>
  );
};

const renderSecondPillarFlow = (
  secondPillar: Conversion,
  secondPillarFunds: Fund[],
  loading: boolean,
) => {
  const pendingWithdrawal = usePendingWithdrawalApplication();
  if (secondPillar.pendingWithdrawal && pendingWithdrawal) {
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
  if (!secondPillar.selectionComplete || !activeFund) {
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

  if (!secondPillar.transfersComplete) {
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
    user: { memberNumber: number };
  };
  exchange: { sourceFunds: Fund[] };
  thirdPillar: { sourceFunds: Fund[] };
}) => ({
  memberNumber: (state.login.user || {}).memberNumber,
  conversion: state.login.userConversion,
  loading: state.login.loadingUserConversion,
  secondPillarFunds: state.exchange.sourceFunds,
  thirdPillarFunds: state.thirdPillar.sourceFunds,
});

export default connect(mapStateToProps)(StatusBox);
