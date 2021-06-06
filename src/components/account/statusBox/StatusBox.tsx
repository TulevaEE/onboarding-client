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

function usePendingWithdrawalApplication(): Application | undefined {
  const { data: applications } = usePendingApplications();

  return applications?.find((application) => {
    return (
      application.type === ApplicationType.WITHDRAWAL ||
      application.type === ApplicationType.EARLY_WITHDRAWAL
    );
  });
}

const SecondPillarButton: React.FunctionComponent<{
  joinTuleva2: boolean;
  pendingWithdrawal: Application | undefined;
}> = ({ joinTuleva2, pendingWithdrawal }) => {
  if (pendingWithdrawal) {
    return (
      <Link to={`/applications/${pendingWithdrawal.id}/cancellation`} className="btn btn-light">
        <Message>account.status.choice.pillar.second.withdraw.cancel</Message>
      </Link>
    );
  }
  if (joinTuleva2) {
    return (
      <Link to="/2nd-pillar-flow" className="btn btn-light">
        <Message>account.status.choice.join.tuleva.2</Message>
      </Link>
    );
  }
  return <></>;
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
  const pendingWithdrawal = usePendingWithdrawalApplication();

  const joinTuleva2 = !(
    conversion.secondPillar.selectionComplete && conversion.secondPillar.transfersComplete
  );

  const hasPendingWithdrawal = conversion.secondPillar.pendingWithdrawal;

  const payTuleva3 = !(
    conversion.thirdPillar.selectionComplete &&
    conversion.thirdPillar.transfersComplete &&
    conversion.thirdPillar.paymentComplete
  );

  const isTulevaMember = memberNumber != null;

  const tulevaData = isTulevaMember
    ? [<Message params={{ memberNumber }}>account.member.statement</Message>]
    : [<Message>account.non.member.statement</Message>];

  const activeSecondPillarFunds = (secondPillarFunds || [])
    .filter((fund) => fund.activeFund)
    .map(({ name }) => name);

  const thirdPillarActiveFunds = (thirdPillarFunds || [])
    .filter((fund) => fund.activeFund)
    .map(({ name }) => name);

  const secondPillarData =
    activeSecondPillarFunds.length > 0
      ? activeSecondPillarFunds
      : [<Message>account.status.choice.pillar.second.missing</Message>];

  const pendingWithdrawalData = [<Message>account.status.choice.pillar.second.withdraw</Message>];

  return (
    <>
      <StatusBoxTitle />

      <div className="card card-secondary">
        <StatusBoxRow
          ok={!joinTuleva2 && !hasPendingWithdrawal}
          showAction={!loading}
          name={<Message>account.status.choice.pillar.second</Message>}
          lines={hasPendingWithdrawal ? pendingWithdrawalData : secondPillarData}
        >
          <SecondPillarButton joinTuleva2={joinTuleva2} pendingWithdrawal={pendingWithdrawal} />
        </StatusBoxRow>

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
