import React from 'react';
import { Message } from 'retranslate';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { StatusBoxRow } from './statusBoxRow/StatusBoxRow';
import SecondPillarStatusBox from './secondPillarStatusBox';
import { Fund, UserConversion } from './types';
import { StatusBoxLoader } from './StatusBoxLoader';
import { StatusBoxTitle } from './StatusBoxTitle';

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
        <SecondPillarStatusBox />

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
