import React from 'react';
import { Message } from 'retranslate';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { StatusBoxRow } from '../statusBoxRow/StatusBoxRow';
import { SourceFund, UserConversion } from '../../../common/apiModels';

interface Props {
  conversion: UserConversion;
  loading: boolean;
  thirdPillarFunds: SourceFund[];
}

export const ThirdPillarStatusBox: React.FunctionComponent<Props> = ({
  conversion,
  loading = false,
  thirdPillarFunds = [],
}) => {
  const payTuleva3 = !(
    conversion.thirdPillar.selectionComplete &&
    conversion.thirdPillar.transfersComplete &&
    conversion.thirdPillar.paymentComplete
  );
  const thirdPillarActiveFunds = thirdPillarFunds
    .filter((fund) => fund.activeFund)
    .map(({ name }) => name);

  return (
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
  );
};

type State = {
  login: {
    userConversion: UserConversion;
    loadingUserConversion: boolean;
  };
  thirdPillar: { sourceFunds: SourceFund[] };
};

const mapStateToProps = (state: State) => ({
  conversion: state.login.userConversion,
  loading: state.login.loadingUserConversion,
  thirdPillarFunds: state.thirdPillar.sourceFunds,
});

export default connect(mapStateToProps)(ThirdPillarStatusBox);
