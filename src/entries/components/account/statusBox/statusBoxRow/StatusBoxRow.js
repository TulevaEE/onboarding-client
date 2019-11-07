import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';
import './StatusBoxRow.scss';

const CheckMark = ({ checked }) => (
  <div className={`ml-3 mr-2 fa${checked ? ' fa-check' : ' fa-times'}`} />
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
    <div className={`d-flex justify-content-between py-2 ${!last ? 'tv-table__row' : ''}`}>
      <div className="d-flex">
        <div className="d-flex flex-column justify-content-center">
          <CheckMark checked={ok} />
        </div>
        <div className="d-flex flex-column justify-content-center">
          <div className="mt-0 pt-1 pl-2">
            <b>{displayName}</b>
          </div>
          {formattedLines}
        </div>
      </div>
      <div className="d-flex flex-column justify-content-center mx-3 text-nowrap">
        {showAction && children ? children : ''}
      </div>
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
