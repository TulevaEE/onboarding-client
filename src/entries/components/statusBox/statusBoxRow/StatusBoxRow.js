import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';

const StatusBoxRow = ({ name, showAction, ok }) => {
  const displayName = <Message>{name}</Message>;
  const displayAction = 'XXXXXXX tbd siia nupp';
  return (
    <div className="row tv-table__row py-2">
      <div className="col-12 col-sm">
        {ok ? '✔' : '🗙'} <b>{displayName}</b>
      </div>
      <div className="col-12 col-sm text-sm-right">{showAction ? <b>{displayAction}</b> : ''}</div>
    </div>
  );
};

StatusBoxRow.defaultProps = {
  name: '',
  showAction: false,
  ok: false,
};

StatusBoxRow.propTypes = {
  name: Types.oneOfType([Types.node, Types.string]),
  showAction: Types.bool,
  ok: Types.bool,
};

export default StatusBoxRow;
