import React from 'react';
import { PropTypes as Types } from 'prop-types';
import classNames from 'classnames';

import './StepTitle.scss';

const StepTitle = ({ children, number, active, completed }) => (
  <div className="tv-step">
    <div
      className={classNames('tv-step__title', 'mb-4', {
        'tv-step__title--active mb-5': active,
        'tv-step__title--completed': completed,
      })}
    >
      {number && (
        <span className="tv-step__number ml-2 mr-3">
          {!completed && !active && <span className="text-regular">{number}</span>}
          {!completed && active && <b>{number}</b>}
        </span>
      )}
      <span className={`mr-2 ${active ? 'h2' : 'text-muted'}`}>{children}</span>
    </div>
  </div>
);

StepTitle.defaultProps = {
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
