import React, { PropTypes as Types } from 'react';

// this component wraps all steps and renders the top and bottom areas.
const Steps = ({ children }) => (
  <div>
    {children}
  </div>
);

Steps.defaultProps = {
  children: null,
};

Steps.propTypes = {
  children: Types.oneOfType([Types.node, Types.arrayOf(Types.node)]),
};

export default Steps;
