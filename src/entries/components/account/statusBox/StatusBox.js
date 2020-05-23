import React from 'react';
import { Message } from 'retranslate';
import { PropTypes as Types } from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import StatusBoxRow from './statusBoxRow';

export const StatusBox = ({
  conversion,
  memberNumber,
  loading,
  secondPillarFunds,
  thirdPillarFunds,
}) => {
  const joinTuleva2 = !(
    conversion.secondPillar.selectionComplete && conversion.secondPillar.transfersComplete
  );
  const joinTuleva3 = !(
    conversion.thirdPillar.selectionComplete && conversion.thirdPillar.transfersComplete
  );

  const payTuleva3 =
    conversion.thirdPillar.selectionComplete &&
    conversion.thirdPillar.transfersComplete &&
    !conversion.thirdPillar.paymentComplete;

  const isTulevaMember = memberNumber != null;

  const tulevaData = isTulevaMember
    ? [<Message params={{ memberNumber }}>account.member.statement</Message>]
    : [<Message>account.non.member.statement</Message>];

  return (
    <>
      <div className="row">
        <div className="col-md-6 mb-4 lead">
          <Message>account.status.choices</Message>
        </div>
      </div>

      <div className="card card-secondary">
        <StatusBoxRow
          ok={!joinTuleva2}
          showAction={!loading}
          name={<Message>account.status.choice.pillar.second</Message>}
          lines={secondPillarFunds.filter(fund => fund.activeFund).map(({ name }) => name)}
        >
          {joinTuleva2 && (
            <Link to="/2nd-pillar-flow" className="btn btn-light">
              <Message>account.status.choice.join.tuleva.2</Message>
            </Link>
          )}
        </StatusBoxRow>

        <StatusBoxRow
          ok={!joinTuleva3}
          showAction={!loading}
          name={<Message>account.status.choice.pillar.third</Message>}
          lines={thirdPillarFunds.filter(fund => fund.activeFund).map(({ name }) => name)}
        >
          {payTuleva3 && (
            <Link to="/3rd-pillar-flow/payment" className="btn btn-light">
              <Message>account.status.choice.pay.tuleva.3</Message>
            </Link>
          )}

          {joinTuleva3 && (
            <Link to="/3rd-pillar-flow" className="btn btn-light">
              <Message>account.status.choice.join.tuleva.3</Message>
            </Link>
          )}
        </StatusBoxRow>

        <StatusBoxRow
          last
          ok={isTulevaMember}
          showAction={!loading}
          name={<Message>account.status.choice.tuleva</Message>}
          lines={tulevaData}
        >
          {!isTulevaMember && (
            <span>
              <a className="btn btn-light" href="https://tuleva.ee/tulundusyhistu/">
                <Message>account.status.choice.join.tuleva</Message>
              </a>
            </span>
          )}
        </StatusBoxRow>
      </div>
      <div className="mt-3">
        <small className="text-muted">
          <Message
            params={{
              contribution: (conversion.thirdPillar.contribution.yearToDate || 0).toString(),
            }}
            dangerouslyTranslateInnerHTML="account.status.yearToDateContribution"
          />
        </small>
      </div>
    </>
  );
};

StatusBox.defaultProps = {
  memberNumber: null,
  conversion: {},
  loading: false,
  secondPillarFunds: [],
  thirdPillarFunds: [],
};

StatusBox.propTypes = {
  memberNumber: Types.number,
  conversion: Types.shape({}),
  loading: Types.bool,
  secondPillarFunds: Types.arrayOf(Types.shape({})),
  thirdPillarFunds: Types.arrayOf(Types.shape({})),
};

const mapStateToProps = state => ({
  memberNumber: (state.login.user || {}).memberNumber,
  conversion: state.login.userConversion,
  loading: state.login.loadingUserConversion,
  secondPillarFunds: state.exchange.sourceFunds,
  thirdPillarFunds: state.thirdPillar.sourceFunds,
});

export default connect(mapStateToProps)(StatusBox);
