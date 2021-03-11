import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import FacebookProvider, { Share } from 'react-facebook';
import { SuccessNotice } from '../../common/SuccessNotice';

import { downloadMandate } from '../../../exchange/actions';

export const Success = ({
  previousPath,
  signedMandateId,
  userContributingFuturePayments,
  userHasTransferredFunds,
  onDownloadMandate,
}) => (
  <div className="row">
    {!signedMandateId && <Redirect to={previousPath} />}
    <div className="col-12 mt-5 px-0">
      <SuccessNotice>
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
      </SuccessNotice>

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
  previousPath: '',
  signedMandateId: null,
  userContributingFuturePayments: null,
  userHasTransferredFunds: null,
  onDownloadMandate: noop,
};

Success.propTypes = {
  previousPath: Types.string,
  signedMandateId: Types.number,
  userContributingFuturePayments: Types.bool,
  userHasTransferredFunds: Types.bool,
  onDownloadMandate: Types.func,
};

const mapStateToProps = (state) => ({
  signedMandateId: state.exchange.signedMandateId,
  userContributingFuturePayments: !!state.exchange.selectedFutureContributionsFundIsin,
  userHasTransferredFunds: !!state.exchange.sourceSelection,
});
const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      onDownloadMandate: downloadMandate,
    },
    dispatch,
  );

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(Success);
