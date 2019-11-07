import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import FacebookProvider, { Share } from 'react-facebook';

import { downloadMandate } from '../../../exchange/actions';
import successImage from './success.svg';
import './Success.scss';

export const Success = ({
  userContributingFuturePayments,
  userHasTransferredFunds,
  onDownloadMandate,
}) => (
  <div className="row">
    <div className="col-12 mt-5 px-0">
      <div className="alert alert-success text-center pt-5 pb-5">
        <div className="tv-success__container">
          <img src={successImage} alt="Success" className="tv-success__check" />
        </div>
        <h2 className="text-center mt-3">
          <Message>success.done</Message>
        </h2>
        <button type="button" className="btn btn-secondary text-center" onClick={onDownloadMandate}>
          <Message>success.download.mandate</Message>
        </button>
        {userContributingFuturePayments ? (
          <p className="mt-4">
            <Message>success.your.payments</Message>
            <b>
              <Message>success.your.payments.next.payment</Message>
            </b>
            .
          </p>
        ) : (
          ''
        )}
        {userHasTransferredFunds ? (
          <p>
            <Message>success.shares.switched</Message>{' '}
            <b>
              <Message>success.shares.switched.when</Message>
            </b>
            .
          </p>
        ) : (
          ''
        )}

        <br />
        <p className="text-center">
          <b>
            <Message>success.share.message</Message>
          </b>
        </p>

        <FacebookProvider appId="1939240566313354">
          <Share href="https://tuleva.ee/fondid/">
            <button className="btn btn-primary mt-3" type="button">
              <Message>success.share.cta</Message>
            </button>
          </Share>
        </FacebookProvider>
      </div>
      <h2 className="mt-5">
        <Message>success.view.profile.title</Message>
      </h2>
      <a className="btn btn-primary mt-4 profile-link" href="/account">
        <Message>success.view.profile.title.button</Message>
      </a>
    </div>
  </div>
);

const noop = () => null;

Success.defaultProps = {
  userContributingFuturePayments: null,
  userHasTransferredFunds: null,
  onDownloadMandate: noop,
};

Success.propTypes = {
  userContributingFuturePayments: Types.bool,
  userHasTransferredFunds: Types.bool,
  onDownloadMandate: Types.func,
};

const mapStateToProps = state => ({
  userContributingFuturePayments: !!state.exchange.selectedFutureContributionsFundIsin,
  userHasTransferredFunds: !!state.exchange.sourceSelection,
});
const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onDownloadMandate: downloadMandate,
    },
    dispatch,
  );

const connectToRedux = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default connectToRedux(Success);
