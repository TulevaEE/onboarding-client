import React from 'react';
import { PropTypes as Types } from 'prop-types';
import classNames from 'classnames';

import './StepTitle.scss';

const StepTitle = ({ children, number, active, completed }) => (
  <div className="tv-step">
    <div
      className={classNames('tv-step__title', 'mb-4', {
        'tv-step__title--active mb-2': active,
        'tv-step__title--completed': completed,
      })}
    >
      {number && (
        <span className="tv-step__number me-3">
          {!completed && !active && <span className="text-regular">{number}</span>}
          {!completed && active && <b>{number}</b>}
        </span>
      )}
      <span className={`me-2 ${active ? 'h2 mb-0' : 'text-body-secondary'}`}>{children}</span>
    </div>
  </div>
);

StepTitle.defaultPropfs = {
  children: '',
  number: null,
  active: false,
  completed: false,
};

StepTitle.propTypes = {
  children: Types.node,
  number: Types.number,
  active: Types.bool,
  completed: Types.bool,
};

export default StepTitle;
