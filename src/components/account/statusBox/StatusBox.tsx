import React from 'react';
import { Message } from 'retranslate';
import { connect } from 'react-redux';
import SecondPillarStatusBox from './secondPillarStatusBox';
import { Fund, UserConversion } from './types';
import { StatusBoxLoader } from './StatusBoxLoader';
import { StatusBoxTitle } from './StatusBoxTitle';
import ThirdPillarStatusBox from './thirdPillarStatusBox';
import MemberStatusBox from './memberStatusBox';

interface Props {
  conversion?: UserConversion;
  secondPillarFunds?: Fund[];
  thirdPillarFunds?: Fund[];
}

export const StatusBox: React.FunctionComponent<Props> = ({
  conversion,
  secondPillarFunds,
  thirdPillarFunds,
}) => {
  if (!conversion || !secondPillarFunds || !thirdPillarFunds) {
    return <StatusBoxLoader />;
  }
  const thirdPillarContribution = conversion.thirdPillar.contribution.yearToDate || 0;
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
            params={{ contribution: thirdPillarContribution.toString() }}
            dangerouslyTranslateInnerHTML="account.status.yearToDateContribution"
          />
        </small>
      </div>
    </>
  );
};

// TODO: Extract into a common shared type
type State = {
  login: {
    userConversion: UserConversion;
  };
  exchange: { sourceFunds: Fund[] };
  thirdPillar: { sourceFunds: Fund[] };
};

const mapStateToProps = (state: State) => ({
  conversion: state.login.userConversion,
  secondPillarFunds: state.exchange.sourceFunds,
  thirdPillarFunds: state.thirdPillar.sourceFunds,
});

export default connect(mapStateToProps)(StatusBox);
