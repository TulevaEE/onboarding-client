import React, { PropTypes as Types } from 'react';

import './StepTitle.scss';

const StepTitle = ({ children, number, active }) => (
  <div className="tv-step">
    <div className={`tv-step__title mb-4 ${active ? 'tv-step__title--active' : ''}`}>
      <span className="tv-step__number ml-2 mr-3">
        {number}
      </span>
      <span className={`mr-2 ${active ? 'h3' : 'text-muted'}`}>{children}</span>
      {active}
    </div>
  </div>
);

StepTitle.defaultProps = {
  children: '',
  number: 1,
  active: false,
};

StepTitle.propTypes = {
  children: Types.node,
  number: Types.number,
  active: Types.bool,
};

export default StepTitle;
