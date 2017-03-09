import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { downloadMandate } from '../../exchange/actions';
import successImage from './success.svg';
import './Success.scss';

export const Success = ({ onDownloadMandate }) => (
  <div className="row">
    <div className="col-12 mt-5 px-0">
      <div className="alert alert-success text-center pt-5 pb-5">
        <div className="tv-success__container">
          <img src={successImage} alt="Success" className="tv-success__check" />
        </div>
        <h2 className="text-center mt-3"><Message>success.done</Message></h2>
        <button className="btn btn-link text-center" onClick={onDownloadMandate}>
          Lae alla
        </button>
        <p className="mt-4">
          <Message>success.your.payments</Message>
          <b><Message>success.your.payments.next.payment</Message></b>.
        </p>
        <p>
          <Message>success.shares.switched</Message>
          <b><Message>success.shares.switched.when</Message></b>.
        </p>
      </div>
    </div>
  </div>
);


const noop = () => null;

Success.defaultProps = {
  onDownloadMandate: noop,
};

Success.propTypes = {
  onDownloadMandate: Types.func,
};

const mapStateToProps = () => ({});
const mapDispatchToProps = dispatch => bindActionCreators({
  onDownloadMandate: downloadMandate,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(Success);
