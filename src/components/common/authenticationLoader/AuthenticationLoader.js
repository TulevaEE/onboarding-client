import React from 'react';
import { PropTypes as Types } from 'prop-types';

import { FormattedMessage } from 'react-intl';
import { Loader } from '..'; // eslint-disable-line import/no-cycle
import './AuthenticationLoader.scss';

const AuthenticationLoader = ({
  controlCode,
  verificationCodeChoice,
  onCancel,
  overlayed,
  signingWithIdCard,
}) => {
  const content = (
    <div className="bg-white shadow-sm rounded-3 p-5 text-center">
      {controlCode ? (
        <>
          <p className="m-0 mb-4 text-balance">
            <FormattedMessage
              id={verificationCodeChoice ? 'login.control.code.choice' : 'login.control.code'}
            />
          </p>
          <div className="display-2 fw-bold mb-2">{controlCode}</div>
          <p className="authentication-loader__hint mx-auto mb-4 small text-body-secondary text-pretty">
            <FormattedMessage id="login.control.code.name.hint" />
          </p>
        </>
      ) : (
        ''
      )}
      {signingWithIdCard && (
        <p className="m-0 mb-4 text-pretty">
          <FormattedMessage id="id.card.signing.instruction" />
        </p>
      )}
      <Loader className="align-middle" />

      {controlCode ? (
        <button type="button" className="btn btn-outline-primary mt-4" onClick={onCancel}>
          <FormattedMessage id="login.stop" />
        </button>
      ) : (
        ''
      )}
    </div>
  );
  if (overlayed) {
    return (
      <div className="tv-modal">
        <div className="col-12 col-sm-10 col-md-7 col-lg-5 mx-auto mt-4 pt-4 px-3">{content}</div>
      </div>
    );
  }
  return <>{content}</>;
};

const noop = () => null;

AuthenticationLoader.defaultProps = {
  controlCode: null,
  verificationCodeChoice: false,
  onCancel: noop,
  overlayed: false,
  signingWithIdCard: false,
};

AuthenticationLoader.propTypes = {
  controlCode: Types.string,
  verificationCodeChoice: Types.bool,
  onCancel: Types.func,
  overlayed: Types.bool,
  signingWithIdCard: Types.bool,
};

export default AuthenticationLoader;
