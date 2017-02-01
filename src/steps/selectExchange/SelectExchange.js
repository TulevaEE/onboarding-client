import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';
import { Link } from 'react-router';
import { connect } from 'react-redux';

import { Loader } from '../../common';
import PensionFundTable from './pensionFundTable';

const SelectExchange = ({ loadingPensionFunds, pensionFunds }) => (
  <div>
    <p className="mb-4 mt-4"><Message>select.exchange.current.status</Message></p>
    {
      loadingPensionFunds ?
        <Loader className="align-middle" /> :
        <PensionFundTable funds={pensionFunds} />
    }
    <Link className="btn btn-primary mt-4 mb-4" to="/steps/select-fund">
      <Message>steps.next</Message>
    </Link>
    <br />
    <small className="text-muted">
      <Message>select.exchange.calculation.info</Message>
    </small>
  </div>
);

SelectExchange.defaultProps = {
  pensionFunds: [],
  loadingPensionFunds: false,
};

SelectExchange.propTypes = {
  pensionFunds: Types.arrayOf(Types.shape({})),
  loadingPensionFunds: Types.bool,
};

const mapStateToProps = state => ({
  pensionFunds: state.exchange.pensionFunds,
  loadingPensionFunds: state.exchange.loadingPensionFunds,
});

const connectToRedux = connect(mapStateToProps);

export default connectToRedux(SelectExchange);
