import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';

import './Comparison.scss';

const Comparison = ({ overlayed, onCancel }) => {
  const content = (
    <div className="row mt-4 pt-4 justify-content-center">
      <div className="alert alert-danger">
        <div>
          <Message>comparison.intro</Message><br />
        </div>
        <button className="btn btn-secondary mt-4" onClick={onCancel}>
          <Message>comparison.close</Message>
        </button>
      </div>
    </div>
  );

  if (overlayed) {
    return (
      <div className="tv-modal">
        <div className="container">
          <div className="row mt-4 pt-4 justify-content-center">
            {content}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="row mt-4 pt-4 justify-content-center">
      {content}
    </div>
  );
};

const noop = () => null;

Comparison.defaultProps = {
  overlayed: false,
  onCancel: noop,
};

Comparison.propTypes = {
  overlayed: Types.bool,
  onCancel: Types.func,
};

export default Comparison;
