import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import StatusBoxRow from '../statusBoxRow';
import { InfoTooltip } from '../../../common';

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
    ? [
        <FormattedMessage id="account.member.statement" values={{ memberNumber }} />,
        <small className="text-muted">
          <FormattedMessage id="account.member.statement.comment" />
        </small>,
      ]
    : [
        <>
          <FormattedMessage id="account.non.member.statement" />
          <InfoTooltip name="member-tooltip">
            <FormattedMessage id="account.non.member.info" />
          </InfoTooltip>
        </>,
      ];

  return (
    <StatusBoxRow
      last
      ok={isTulevaMember}
      warning={!isTulevaMember}
      showAction={!loading}
      name={<FormattedMessage id="account.status.choice.tuleva" />}
      lines={tulevaData}
    >
      {!isTulevaMember && (
        <Link to="/join" className="btn btn-light">
          <FormattedMessage id="account.status.choice.join.tuleva" />
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
