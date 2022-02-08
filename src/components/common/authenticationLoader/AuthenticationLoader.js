import React from 'react';
import { PropTypes as Types } from 'prop-types';

import { FormattedMessage } from 'react-intl';
import { Loader } from '..'; // eslint-disable-line import/no-cycle
import './AuthenticationLoader.scss';

const AuthenticationLoader = ({ controlCode, onCancel, overlayed }) => {
  const content = (
    <div className="card text-center p-4 tv-modal__content">
      <div className="p-4">
        {controlCode ? (
          <div>
            <p>
              <FormattedMessage id="login.control.code" />
            </p>
            <div className="control-code">{controlCode}</div>
          </div>
        ) : (
          ''
        )}
        <Loader className="align-middle" />

        {controlCode ? (
          <button type="button" className="btn btn-secondary mt-4" onClick={onCancel}>
            <FormattedMessage id="login.stop" />
          </button>
        ) : (
          ''
        )}
      </div>
    </div>
  );
  if (overlayed) {
    return (
      <div className="tv-modal">
        <div className="container">
          <div className="row mt-4 pt-4 justify-content-center">{content}</div>
        </div>
      </div>
    );
  }
  return <div className="row mt-4 pt-4 justify-content-center">{content}</div>;
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
