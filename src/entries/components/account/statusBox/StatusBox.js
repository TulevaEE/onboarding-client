import React, { Fragment } from 'react';
import { Message } from 'retranslate';
import { PropTypes as Types } from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import StatusBoxRow from './statusBoxRow';

const StatusBox = ({ currentBalanceFunds }) => {
  const secondPillarData = currentBalanceFunds.filter(
    ({ activeFund, pillar }) => activeFund === true && pillar === 2,
  );

  const thirdPillarData = currentBalanceFunds.filter(
    ({ activeFund, pillar }) => activeFund === true && pillar === 3,
  );

  const tulevaData = [];

  return (
    <Fragment>
      <div className="row ">
        <div className="col-12">
          <div className="px-col mb-4">
            <p className="mb-4 lead">
              <Message>account.status.choices</Message>
            </p>
          </div>
        </div>
      </div>

      <div className="card card-secondary p-4">
        <StatusBoxRow
          ok={false}
          name={<Message>account.status.choice.pillar.second</Message>}
          lines={secondPillarData.map(({ name }) => name)}
        >
          <button type="submit" className="btn btn-secondary btn-link mb-2 mr-2">
            nupp siia
          </button>
        </StatusBoxRow>

        <StatusBoxRow
          ok={false}
          showAction
          name={<Message>account.status.choice.pillar.third</Message>}
          lines={thirdPillarData.map(({ name }) => name)}
        >
          <button type="submit" className="btn btn-secondary btn-link mb-2 mr-2">
            nupp siia
          </button>
        </StatusBoxRow>

        <StatusBoxRow
          ok
          showAction
          name={<Message>account.status.choice.tuleva</Message>}
          lines={tulevaData.map(({ name }) => name)}
        >
          <button type="submit" className="btn btn-secondary btn-link mb-2 mr-2">
            nupp siia
          </button>
        </StatusBoxRow>
      </div>
    </Fragment>
  );
};

StatusBox.defaultProps = {
  // age: null,
  currentBalanceFunds: [],
};

StatusBox.propTypes = {
  currentBalanceFunds: Types.arrayOf(Types.object),
  // age: Types.number,
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
