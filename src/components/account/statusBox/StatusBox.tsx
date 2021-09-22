import React from 'react';
import { Message } from 'retranslate';
import { connect } from 'react-redux';
import SecondPillarStatusBox from './secondPillarStatusBox';
import { Fund, UserConversion } from './types';
import { StatusBoxLoader } from './StatusBoxLoader';
import { StatusBoxTitle } from './StatusBoxTitle';
import ThirdPillarStatusBox from './thirdPillarStatusBox';
import MemberStatusBox from './memberStatusBox';

interface StatusBoxType {
  conversion?: UserConversion;
  secondPillarFunds: Fund[];
  thirdPillarFunds: Fund[];
}

export const StatusBox: React.FunctionComponent<StatusBoxType> = ({
  conversion,
  secondPillarFunds = [],
  thirdPillarFunds = [],
}) => {
  if (!conversion || !secondPillarFunds || !thirdPillarFunds) {
    return <StatusBoxLoader />;
  }
  return (
    <>
      <StatusBoxTitle />

      <div className="card card-secondary">
        <SecondPillarStatusBox />
        <ThirdPillarStatusBox />
        <MemberStatusBox />
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
  };
  exchange: { sourceFunds: Fund[] };
  thirdPillar: { sourceFunds: Fund[] };
}) => ({
  conversion: state.login.userConversion,
  secondPillarFunds: state.exchange.sourceFunds,
  thirdPillarFunds: state.thirdPillar.sourceFunds,
});

export default connect(mapStateToProps)(StatusBox);
