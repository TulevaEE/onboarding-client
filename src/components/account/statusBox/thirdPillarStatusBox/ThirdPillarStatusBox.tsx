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
  const activeFunds = sourceFunds.filter((fund) => fund.activeFund).map(({ name }) => name);

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

  return (
    <StatusBoxRow
      ok={!payTuleva3}
      showAction={!loading}
      name={<Message>account.status.choice.pillar.third</Message>}
      lines={activeFunds}
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
    user: { isThirdPillarActive: boolean };
  };
  thirdPillar: { sourceFunds: SourceFund[] };
};

const mapStateToProps = (state: State) => ({
  conversion: state.login.userConversion,
  loading: state.login.loadingUserConversion,
  sourceFunds: state.thirdPillar.sourceFunds,
  pillarActive: state.login.user.isThirdPillarActive,
});

export default connect(mapStateToProps)(ThirdPillarStatusBox);
