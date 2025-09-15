import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import StatusBoxRow from '../statusBoxRow';
import { formatDateYear } from '../../../common/dateFormatter';
import { useCapitalEvents } from '../../../common/apiHooks';
import { Euro } from '../../../common/Euro';
import { InfoTooltip } from '../../../common/infoTooltip/InfoTooltip';

interface Props {
  loading: boolean;
  memberNumber: number | null;
  memberJoinDate: string | null;
}

export const MemberStatusBox: React.FunctionComponent<Props> = ({
  loading = false,
  memberNumber,
  memberJoinDate,
}) => {
  const { data: capitalEvents } = useCapitalEvents();
  const lastMembershipBonus = capitalEvents
    ?.filter((event) => event.type === 'MEMBERSHIP_BONUS' && event.value >= 0)
    .sort((event1, event2) => event2.date.localeCompare(event1.date))[0];

  const isTulevaMember = memberNumber != null;
  const tulevaData = isTulevaMember
    ? [
        <FormattedMessage id="account.member.statement" values={{ memberNumber }} />,
        <span className="text-body-secondary">
          {lastMembershipBonus ? (
            <FormattedMessage
              id="account.member.statement.comment.amount"
              values={{
                year: new Date(lastMembershipBonus.date).getFullYear(),
                amount: (
                  <strong>
                    <Euro amount={lastMembershipBonus.value} />
                  </strong>
                ),
              }}
            />
          ) : (
            <FormattedMessage
              id="account.member.statement.comment"
              values={{ memberJoinDate: formatDateYear(memberJoinDate) }}
            />
          )}
        </span>,
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
        <Link to="/join" className="btn btn-outline-primary">
          <FormattedMessage id="account.status.choice.join.tuleva" />
        </Link>
      )}
    </StatusBoxRow>
  );
};

type State = {
  login: {
    loadingUserConversion: boolean;
    user: {
      memberNumber: number;
      memberJoinDate: string;
    };
  };
};

const mapStateToProps = (state: State) => ({
  memberNumber: (state.login.user || {}).memberNumber,
  memberJoinDate: (state.login.user || {}).memberJoinDate,
  loading: state.login.loadingUserConversion,
});

export default connect(mapStateToProps)(MemberStatusBox);
