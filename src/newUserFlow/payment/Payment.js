import React, { PropTypes as Types } from 'react';
import { connect } from 'react-redux';
import { Message } from 'retranslate';

export const Payment = ({ userId }) => (
  <div>
    <div className="mb-4">
      <p className="mb-4 mt-5 lead"><Message>new.user.flow.payment.title</Message></p>
      <p><Message>new.user.flow.payment.intro</Message></p>

      <a
        // href={`https://payment.maksekeskus.ee/pay/1/link.html?shopId=8c1a6c0a-2467-4166-ab47-006ddbf38b06&amount=100&reference=${userId}&return_url=https://onboarding-service.tuleva.ee/notifications/payments&return_method=POST&cancel_url=https://pension.tuleva.ee/steps/payment&cancel_method=GET&notification_url=https://onboarding-service.tuleva.ee/notifications/payments&notification_method=POST`}
        href={`https://payment-test.maksekeskus.ee/pay/1/link.html?shopId=322a5e5e-37ee-45b1-8961-ebd00e84e209&amount=100&reference=${userId}`}
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
