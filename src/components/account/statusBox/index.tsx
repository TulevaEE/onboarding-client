import React from 'react';
import { connect } from 'react-redux';
import SecondPillarStatusBox from './secondPillarStatusBox';
import { StatusBoxLoader } from './StatusBoxLoader';
import { StatusBoxTitle } from './StatusBoxTitle';
import ThirdPillarStatusBox from './thirdPillarStatusBox';
import MemberStatusBox from './memberStatusBox';
import { SourceFund, UserConversion } from '../../common/apiModels';
import SavingsFundStatusBox from './savingsFundStatusBox/SavingsFundStatusBox';
import { useSavingsFundOnboardingStatus } from '../../common/apiHooks';

interface Props {
  conversion?: UserConversion;
  secondPillarFunds?: SourceFund[];
  thirdPillarFunds?: SourceFund[];
  loading?: boolean;
}

export const StatusBoxComponent: React.FunctionComponent<Props> = ({
  conversion,
  secondPillarFunds,
  thirdPillarFunds,
  loading = false,
}) => {
  useSavingsFundOnboardingStatus();

  // `loading` covers refreshes over stale data — e.g. a role switch refetches
  // everything, and the previous role's data must not flash wrong statuses.
  if (loading || !conversion || !secondPillarFunds || !thirdPillarFunds) {
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
    loadingUserConversion: boolean;
  };
  exchange: { sourceFunds: SourceFund[]; loadingSourceFunds: boolean };
  thirdPillar: { sourceFunds: SourceFund[]; loadingSourceFunds: boolean };
};

const mapStateToProps = (state: State) => ({
  conversion: state.login.userConversion,
  secondPillarFunds: state.exchange.sourceFunds,
  thirdPillarFunds: state.thirdPillar.sourceFunds,
  loading:
    state.login.loadingUserConversion ||
    state.exchange.loadingSourceFunds ||
    state.thirdPillar.loadingSourceFunds,
});

export const StatusBox = connect(mapStateToProps)(StatusBoxComponent);
