import React from 'react';
import { PropTypes as Types } from 'prop-types';

import './Loader.scss';

const Loader = ({ className, label }) => (
  <div className={`loader ${className}`} role="progressbar" aria-label={label}>
    <svg className="circular" viewBox="25 25 50 50">
      <circle
        className="path"
        cx="50"
        cy="50"
        r="20"
        fill="none"
        strokeWidth="3"
        strokeMiterlimit="10"
      />
    </svg>
  </div>
);

Loader.defaultProps = {
  className: '',
  label: 'Loading...',
};

Loader.propTypes = {
  className: Types.string,
  label: Types.string,
};

export default Loader;
