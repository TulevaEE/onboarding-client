import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';

const StatusBoxRow = ({ name, lines, showAction, ok, children, last }) => {
  const displayName = <Message>{name}</Message>;
  const formattedLines = (
    <ul>
      {lines.map(line => {
        return line;
      })}
    </ul>
  );
  return (
    <div className={`row  py-2 ${!last ? 'tv-table__row' : ''}`}>
      <div className="col-12 col-sm">
        {ok ? '✔' : '🗙'} <b>{displayName}</b>
        {formattedLines}
      </div>
      <div className="col-12 col-sm text-sm-right">{showAction && children ? children : ''}</div>
    </div>
  );
};

StatusBoxRow.defaultProps = {
  name: '',
  lines: [],
  showAction: false,
  ok: false,
  children: null,
  last: false,
};

StatusBoxRow.propTypes = {
  name: Types.oneOfType([Types.node, Types.string]),
  lines: Types.arrayOf(Types.object),
  showAction: Types.bool,
  ok: Types.bool,
  children: Types.node,
  last: Types.bool,
};

export default StatusBoxRow;
