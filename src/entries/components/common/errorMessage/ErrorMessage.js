import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';

import './ErrorMessage.css';

const noop = () => null;

const ErrorMessage = ({ errors, onCancel, overlayed }) => {
  const content = (
    <div className="card text-center p-4 tv-modal__content">
      <div className="p-4">
        <div>
          <p>
            <b>
              <Message>error.messages.intro</Message>
            </b>
          </p>
          {errors.errors &&
            errors.errors.map((error, index) => (
              <p key={index}>
                <Message>{error.code}</Message>
              </p>
            ))}
        </div>
        {onCancel !== noop ? (
          <button className="btn btn-secondary mt-4" onClick={onCancel}>
            <Message>error.message.close</Message>
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
  return (((errors || {}).errors || []).find(error => !error.path) || {}).code;
}

export default ErrorMessage;
