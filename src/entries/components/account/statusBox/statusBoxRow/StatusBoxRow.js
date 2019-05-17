import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';
import './StatusBoxRow.scss';

const CheckMark = ({ checked }) => (
  <div className="status-box-row pt-1">{checked ? '✔' : '🗙'} </div>
);
CheckMark.defaultProps = {
  checked: false,
};

CheckMark.propTypes = {
  checked: Types.bool,
};

const StatusBoxRow = ({ name, lines, showAction, ok, children, last }) => {
  const displayName = <Message>{name}</Message>;
  const formattedLines = (
    <ul className="status-box-row">
      {lines &&
        lines.length > 0 &&
        lines.map(line => {
          return (
            <li className="status-box-row pl-2" key={line}>
              {line}
            </li>
          );
        })}
    </ul>
  );
  return (
    <div className={`row  py-2 ${!last ? 'tv-table__row' : ''}`}>
      <div className="media">
        <CheckMark checked={ok} />
        <div className="media-body">
          <div className="mt-0 pt-1 pl-2">
            <b>{displayName}</b>
          </div>
          {formattedLines}
        </div>
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
  lines: Types.arrayOf(Types.oneOfType([Types.node, Types.string, Types.string])),
  showAction: Types.bool,
  ok: Types.bool,
  children: Types.node,
  last: Types.bool,
};

export default StatusBoxRow;
