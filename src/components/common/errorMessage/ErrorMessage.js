import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { FormattedMessage } from 'react-intl';

import './ErrorMessage.scss';

const noop = () => null;

const ErrorMessage = ({ errors, onCancel, overlayed }) => {
  const content = (
    <div className="bg-white shadow-sm rounded-lg p-5 text-center">
      <p>
        <b>
          <FormattedMessage id="error.messages.intro" />
        </b>
      </p>
      {errors.errors &&
        errors.errors.map((error, index) => (
          <p className="text-muted small" key={index}>
            <FormattedMessage id={error.code} /> {error.message}
          </p>
        ))}
      {onCancel !== noop ? (
        <button type="button" className="btn btn-primary mt-4" onClick={onCancel}>
          <FormattedMessage id="error.message.close" />
        </button>
      ) : (
        ''
      )}
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
  return <>{content}</>;
};

ErrorMessage.defaultProps = {
  errors: { errors: [] },
  onCancel: noop,
  overlayed: false,
};

ErrorMessage.propTypes = {
  errors: Types.shape({
    errors: Types.arrayOf(Types.shape({})),
  }),
  onCancel: Types.func,
  overlayed: Types.bool,
};

export function getGlobalErrorCode(errors) {
  const globalErrorCode = (((errors || {}).errors || []).find((error) => !error.path) || {}).code;
  const firstLocalErrorCode = (((errors || {}).errors || [])[0] || {}).code;

  return globalErrorCode || firstLocalErrorCode;
}

export default ErrorMessage;
