import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { SuccessNotice } from '../../common/SuccessNotice/SuccessNotice';

import { downloadMandate } from '../../../exchange/actions';
import secondPillarTransferDate from '../secondPillarTransferDate';

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
          <FormattedMessage id="success.done" />
        </h2>
        <button type="button" className="btn btn-secondary text-center" onClick={onDownloadMandate}>
          <FormattedMessage id="success.download.mandate" />
        </button>
        {userContributingFuturePayments ? (
          <p className="mt-4">
            <FormattedMessage id="success.your.payments" />
            <b>
              <FormattedMessage id="success.your.payments.next.payment" />
            </b>
            .
          </p>
        ) : (
          ''
        )}
        {userHasTransferredFunds ? (
          <p>
            <FormattedMessage id="success.shares.switched" />{' '}
            <b>
              <FormattedMessage
                id="success.shares.switched.when"
                values={{
                  transferDate: secondPillarTransferDate().format('DD.MM.YYYY'),
                }}
              />
            </b>
            .
          </p>
        ) : (
          ''
        )}
      </SuccessNotice>
      <h2 className="mt-5">
        <FormattedMessage id="success.view.profile.title" />
      </h2>
      <a className="btn btn-primary mt-4 profile-link" href="/account">
        <FormattedMessage id="success.view.profile.title.button" />
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
