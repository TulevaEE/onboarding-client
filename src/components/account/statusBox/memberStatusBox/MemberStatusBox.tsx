import React from 'react';
import { Message } from 'retranslate';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import StatusBoxRow from '../statusBoxRow';

interface Props {
  loading: boolean;
  memberNumber: number | null;
}

export const MemberStatusBox: React.FunctionComponent<Props> = ({
  loading = false,
  memberNumber,
}) => {
  const isTulevaMember = memberNumber != null;
  const tulevaData = isTulevaMember
    ? [<Message params={{ memberNumber }}>account.member.statement</Message>]
    : [<Message>account.non.member.statement</Message>];

  return (
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
  );
};

type State = {
  login: {
    loadingUserConversion: boolean;
    user: { memberNumber: number };
  };
};

const mapStateToProps = (state: State) => ({
  memberNumber: (state.login.user || {}).memberNumber,
  loading: state.login.loadingUserConversion,
});

export default connect(mapStateToProps)(MemberStatusBox);
