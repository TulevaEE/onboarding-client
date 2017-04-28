import React, { PropTypes as Types } from 'react';
import { connect } from 'react-redux';
// import { Message } from 'retranslate';
// import { Link } from 'react-router';

export const Payment = ({ userId }) => (
  <div>
    <div className="mb-4">
      <p className="mb-4 mt-5 lead">Liikmetasu</p>
      <p>Järgmiseks kanna üle liikmetasu ning oledki Tuleva liige.</p>
      <p>Seejärel saad kogu oma pensioni Tulevasse üle tuua.</p>

      <a
        href={`https://payment-test.maksekeskus.ee/pay/1/link.html?shopId=322a5e5e-37ee-45b1-8961-ebd00e84e209&amount=1000&reference=${userId}`}
        className="btn btn-primary"
      >Pangalingid</a>
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
