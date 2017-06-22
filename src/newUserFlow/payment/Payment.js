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
        href={`${config.get('newUserPaymentRedirectBaseUrl')}&amount=100&reference=${userId}&return_url=https://onboarding-service.tuleva.ee/notifications/payments&return_method=POST&cancel_url=https://pension.tuleva.ee/steps/payment&cancel_method=GET&notification_url=https://onboarding-service.tuleva.ee/notifications/payments&notification_method=POST`}
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
