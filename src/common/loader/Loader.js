import React from 'react';
import { PropTypes as Types } from 'prop-types';

import './Loader.scss';

const Loader = ({ className }) => (
  <div className={`loader ${className}`}>
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
};

Loader.propTypes = {
  className: Types.string,
};

export default Loader;
