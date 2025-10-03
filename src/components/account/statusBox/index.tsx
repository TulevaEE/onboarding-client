import React from 'react';
import { connect } from 'react-redux';
import SecondPillarStatusBox from './secondPillarStatusBox';
import { StatusBoxLoader } from './StatusBoxLoader';
import { StatusBoxTitle } from './StatusBoxTitle';
import ThirdPillarStatusBox from './thirdPillarStatusBox';
import MemberStatusBox from './memberStatusBox';
import { SourceFund, UserConversion } from '../../common/apiModels';
import SavingsFundStatusBox from './savingsFundStatusBox/SavingsFundStatusBox';

interface Props {
  conversion?: UserConversion;
  secondPillarFunds?: SourceFund[];
  thirdPillarFunds?: SourceFund[];
}

export const StatusBoxComponent: React.FunctionComponent<Props> = ({
  conversion,
  secondPillarFunds,
  thirdPillarFunds,
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
        <SavingsFundStatusBox />
        <MemberStatusBox />
      </div>
    </>
  );
};

// TODO: Extract into a common shared type
type State = {
  login: {
    userConversion: UserConversion;
  };
  exchange: { sourceFunds: SourceFund[] };
  thirdPillar: { sourceFunds: SourceFund[] };
};

const mapStateToProps = (state: State) => ({
  conversion: state.login.userConversion,
  secondPillarFunds: state.exchange.sourceFunds,
  thirdPillarFunds: state.thirdPillar.sourceFunds,
});

export const StatusBox = connect(mapStateToProps)(StatusBoxComponent);
