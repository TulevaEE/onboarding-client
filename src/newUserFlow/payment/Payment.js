import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { connect } from 'react-redux';
import { Message } from 'retranslate';
import config from 'react-global-configuration';

export const Payment = ({ userId }) => (
  <div>
    <div className="mb-4">
      <p className="mb-4 mt-5 lead"><Message>new.user.flow.payment.title</Message></p>
      <p><Message>new.user.flow.payment.intro</Message></p>

      <a
        href={`${config.get('newUserPaymentRedirectBaseUrl')}&reference=${userId}`}
        className="btn btn-primary"
      ><Message>new.user.flow.payment.bank.links</Message></a>
    </div>

  </div>
);

Payment.defaultProps = {
  userId: null,
};

Payment.propTypes = {
  userId: Types.number,
};

const mapStateToProps = state => ({
  userId: (state.login.user || {}).id,
});

const connectToRedux = connect(mapStateToProps);

export default connectToRedux(Payment);
