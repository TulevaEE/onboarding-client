import React from 'react';
import { Message } from 'retranslate';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { StatusBoxRow } from '../statusBoxRow/StatusBoxRow';
import { SourceFund, UserConversion } from '../../../common/apiModels';

interface Props {
  conversion: UserConversion;
  loading: boolean;
  sourceFunds: SourceFund[];
  pillarActive: boolean;
}

export const ThirdPillarStatusBox: React.FunctionComponent<Props> = ({
  conversion,
  loading = false,
  sourceFunds = [],
  pillarActive,
}) => {
  const payTuleva3 = !(
    conversion.thirdPillar.selectionComplete &&
    conversion.thirdPillar.transfersComplete &&
    conversion.thirdPillar.paymentComplete
  );
  if (!pillarActive) {
    return (
      <StatusBoxRow
        showAction={!loading}
        name={<Message>account.status.choice.pillar.third</Message>}
        lines={[<Message>account.status.choice.pillar.third.missing.label</Message>]}
      >
        <Link to="/3rd-pillar-flow" className="btn btn-light">
          <Message>account.status.choice.pillar.third.missing.action</Message>
        </Link>
      </StatusBoxRow>
    );
  }

  const activeFund = sourceFunds.find((fund) => fund.activeFund)?.name;
  if (!conversion.thirdPillar.selectionComplete) {
    return (
      <StatusBoxRow
        showAction={!loading}
        name={<Message>account.status.choice.pillar.third</Message>}
        lines={[activeFund]}
      >
        <Link to="/3rd-pillar-flow" className="btn btn-light">
          <Message>account.status.choice.pillar.third.inactive.action</Message>
        </Link>
      </StatusBoxRow>
    );
  }

  return (
    <StatusBoxRow
      ok={!payTuleva3}
      showAction={!loading}
      name={<Message>account.status.choice.pillar.third</Message>}
      lines={[activeFund]}
    >
      <Link to="/3rd-pillar-flow" className="btn btn-light">
        <Message>account.status.choice.pay.tuleva.3</Message>
      </Link>
    </StatusBoxRow>
  );
};

type State = {
  login: {
    userConversion: UserConversion;
    loadingUserConversion: boolean;
    user: { thirdPillarActive: boolean };
  };
  thirdPillar: { sourceFunds: SourceFund[] };
};

const mapStateToProps = (state: State) => ({
  conversion: state.login.userConversion,
  loading: state.login.loadingUserConversion,
  sourceFunds: state.thirdPillar.sourceFunds,
  pillarActive: state.login.user.thirdPillarActive,
});

export default connect(mapStateToProps)(ThirdPillarStatusBox);
