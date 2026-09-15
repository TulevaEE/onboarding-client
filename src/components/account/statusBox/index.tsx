import React from 'react';
import { connect } from 'react-redux';
import SecondPillarStatusBox from './secondPillarStatusBox';
import { StatusBoxLoader } from './StatusBoxLoader';
import { StatusBoxTitle } from './StatusBoxTitle';
import ThirdPillarStatusBox from './thirdPillarStatusBox';
import MemberStatusBox from './memberStatusBox';
import { SourceFund, UserConversion } from '../../common/apiModels';
import SavingsFundStatusBox from './savingsFundStatusBox/SavingsFundStatusBox';
import { useNudge, useSavingsFundOnboardingStatus } from '../../common/apiHooks';
import { StatusBoxEmphasisProvider } from './statusBoxEmphasis';

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
  const { data: decision, isInitialLoading: loadingDecision } = useNudge('ACCOUNT');

  // `loading` covers refreshes over stale data — e.g. a role switch refetches
  // everything, and the previous role's data must not flash wrong statuses.
  if (loading || loadingDecision || !conversion || !secondPillarFunds || !thirdPillarFunds) {
    return <StatusBoxLoader />;
  }

  const paymentRateSeason = decision?.paymentRateSeason;
  const paymentRateLeads = !!paymentRateSeason && decision?.key === 'SECOND_PILLAR_PAYMENT_RATE';

  return (
    <>
      <StatusBoxTitle />

      <div className="card card-secondary">
        <StatusBoxEmphasisProvider value={paymentRateLeads ? 'primary' : undefined}>
          <SecondPillarStatusBox paymentRateSeason={paymentRateSeason} />
        </StatusBoxEmphasisProvider>
        <StatusBoxEmphasisProvider value={paymentRateLeads ? 'secondary' : undefined}>
          <ThirdPillarStatusBox />
          <SavingsFundStatusBox />
          <MemberStatusBox />
        </StatusBoxEmphasisProvider>
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
