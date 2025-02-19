import React from 'react';
import { PropTypes as Types } from 'prop-types';

import { FormattedMessage } from 'react-intl';
import { Loader } from '..'; // eslint-disable-line import/no-cycle
import './AuthenticationLoader.scss';

const AuthenticationLoader = ({ controlCode, onCancel, overlayed }) => {
  const content = (
    <div className="bg-white shadow-sm rounded-3 p-5 text-center">
      {controlCode ? (
        <>
          <p className="m-0 mb-4">
            <FormattedMessage id="login.control.code" />
          </p>
          <div className="display-2 fw-bold mb-2">{controlCode}</div>
        </>
      ) : (
        ''
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
        <div className="col-12 col-sm-10 col-md-7 col-lg-5 mx-auto">
          <div className="row mt-4 pt-4 justify-content-center">{content}</div>
        </div>
      </div>
    );
  }
  return <>{content}</>;
};

const noop = () => null;

AuthenticationLoader.defaultProps = {
  controlCode: null,
  onCancel: noop,
  overlayed: false,
};

AuthenticationLoader.propTypes = {
  controlCode: Types.string,
  onCancel: Types.func,
  overlayed: Types.bool,
};

export default AuthenticationLoader;
