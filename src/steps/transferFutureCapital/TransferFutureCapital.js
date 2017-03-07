import React, { PropTypes as Types } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message } from 'retranslate';
import { Link } from 'react-router';

import { Radio } from '../../common';
import { setTransferFutureCapital } from '../../exchange/actions';

export const TransferFutureCapital = ({ transferFutureCapital, onChangeTransferFutureCapital }) => (
  <div>
    <div className="px-col">
      <p className="lead m-0">
        <Message>transfer.future.capital.intro</Message>
      </p>
    </div>
    <Radio
      name="tv-transfer-future-capital"
      selected={transferFutureCapital}
      className="mt-4"
      onSelect={() => onChangeTransferFutureCapital(true)}
    >
      <h3 className="m-0"><Message>transfer.future.capital.yes</Message></h3>
    </Radio>
    <Radio
      name="tv-transfer-future-capital"
      selected={!transferFutureCapital}
      className="mt-4"
      onSelect={() => onChangeTransferFutureCapital(false)}
    >
      <h3 className="m-0"><Message>transfer.future.capital.no</Message></h3>
    </Radio>
    <div className="px-col mt-5">
      <Link className="btn btn-primary mr-2" to="/steps/confirm-mandate">
        <Message>steps.next</Message>
      </Link>
      <Link className="btn btn-secondary" to="/steps/select-sources">
        <Message>steps.previous</Message>
      </Link>
    </div>
  </div>
);

const noop = () => null;

TransferFutureCapital.defaultProps = {
  transferFutureCapital: true,
  onChangeTransferFutureCapital: noop,
};

TransferFutureCapital.propTypes = {
  transferFutureCapital: Types.bool,
  onChangeTransferFutureCapital: Types.func,
};

const mapStateToProps = state => ({
  transferFutureCapital: state.exchange.transferFutureCapital,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  onChangeTransferFutureCapital: setTransferFutureCapital,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(TransferFutureCapital);
