import React from 'react';
import { Message } from 'retranslate';
import { PropTypes as Types } from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Link } from 'react-router-dom';
import StatusBoxRow from './statusBoxRow';

const StatusBox = ({ currentBalanceFunds, memberNumber, age, loading }) => {
  const managedByTuleva = funds => {
    return funds.filter(fund => fund.managerName === 'Tuleva');
  };

  const joinTuleva = funds => {
    return funds.length === 0 || funds.length !== managedByTuleva(funds).length;
  };

  const secondPillarData = currentBalanceFunds.filter(({ pillar }) => pillar === 2);

  const joinTulevaSoon = age >= 49;
  const joinTuleva2 = joinTuleva(secondPillarData);

  const isTulevaMember = memberNumber != null;

  const tulevaData = isTulevaMember
    ? [<Message params={{ memberNumber }}>account.member.statement</Message>]
    : [];

  return (
    <>
      <div className="row ">
        <div className="col-12">
          <div className="px-col mb-4">
            <p className="mb-4 lead">
              <Message>account.status.choices</Message>
            </p>
          </div>
        </div>
      </div>

      <div className="card card-secondary">
        <StatusBoxRow
          ok={!joinTuleva2 && !joinTulevaSoon}
          showAction={!loading}
          name={<Message>account.status.choice.pillar.second</Message>}
          lines={secondPillarData.map(({ name }) => name)}
        >
          {joinTuleva2 && !joinTulevaSoon && (
            <Link to="/2nd-pillar-flow">
              <Message>account.status.choice.join.tuleva.2</Message>
            </Link>
          )}

          {joinTulevaSoon && (
            <span>
              <a className="btn btn-link p-0 border-0" href="https://tuleva.ee/tulundusyhistu/">
                <Message>account.status.choice.1970.coming.soon</Message>
              </a>
            </span>
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
              <a className="btn btn-link p-0 border-0" href="https://tuleva.ee/tulundusyhistu/">
                <Message>account.status.choice.join.tuleva</Message>
              </a>
            </span>
          )}
        </StatusBoxRow>
      </div>
      <br />
    </>
  );
};

StatusBox.defaultProps = {
  age: null,
  currentBalanceFunds: [],
  memberNumber: null,
  loading: null,
};

StatusBox.propTypes = {
  currentBalanceFunds: Types.arrayOf(Types.object),
  memberNumber: Types.number,
  age: Types.number,
  loading: Types.bool,
};

const mapStateToProps = state => ({
  ...state,
});

const mapDispatchToProps = dispatch => bindActionCreators({}, dispatch);
const withRedux = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default withRedux(StatusBox);
