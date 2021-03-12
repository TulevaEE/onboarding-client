import React from 'react';
import { Message } from 'retranslate';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { StatusBoxRow } from './statusBoxRow/StatusBoxRow';

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
  activeFund: string;
  name: string;
}

interface StatusBoxType {
  memberNumber: number | null;
  conversion: UserConversion;
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
  const joinTuleva2 = !(
    conversion.secondPillar.selectionComplete && conversion.secondPillar.transfersComplete
  );

  const payTuleva3 = !(
    conversion.thirdPillar.selectionComplete &&
    conversion.thirdPillar.transfersComplete &&
    conversion.thirdPillar.paymentComplete
  );

  const isTulevaMember = memberNumber != null;

  const tulevaData = isTulevaMember
    ? [<Message params={{ memberNumber }}>account.member.statement</Message>]
    : [<Message>account.non.member.statement</Message>];

  const activeSecondPillarFunds = secondPillarFunds
    .filter((fund) => fund.activeFund)
    .map(({ name }) => name);

  const thirdPillarActiveFunds = thirdPillarFunds
    .filter((fund) => fund.activeFund)
    .map(({ name }) => name);

  return (
    <>
      <div className="row">
        <div className="col-md-6 mb-4 lead">
          <Message>account.status.choices</Message>
        </div>
      </div>

      <div className="card card-secondary">
        <StatusBoxRow
          ok={!joinTuleva2}
          showAction={!loading}
          name={<Message>account.status.choice.pillar.second</Message>}
          lines={
            activeSecondPillarFunds.length > 0
              ? activeSecondPillarFunds
              : [<Message>account.status.choice.pillar.second.missing</Message>]
          }
        >
          {joinTuleva2 && (
            <Link to="/2nd-pillar-flow" className="btn btn-light">
              <Message>account.status.choice.join.tuleva.2</Message>
            </Link>
          )}
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
            <span>
              <a className="btn btn-light" href="https://tuleva.ee/tulundusyhistu/">
                <Message>account.status.choice.join.tuleva</Message>
              </a>
            </span>
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
