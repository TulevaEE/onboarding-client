import React from 'react';
import { Message } from 'retranslate';
import './StatusBoxRow.scss';

const CheckMark: React.FunctionComponent<{ checked: boolean }> = ({ checked = false }) => (
  <div className={`ml-3 mr-2 fa${checked ? ' fa-check' : ' fa-times'}`} />
);

export const StatusBoxRow: React.FunctionComponent<{
  name?: React.ReactNode;
  lines?: React.ReactNode[];
  showAction?: boolean;
  ok?: boolean;
  last?: boolean;
  children?: React.ReactNode;
}> = ({ name = '', lines = [], showAction = false, ok = false, children = '', last = false }) => {
  const displayName = <Message>{name}</Message>;
  const formattedLines = (
    <ul>
      {lines &&
        lines.length > 0 &&
        lines.map((line, i) => {
          return (
            <li className="pl-2" key={i}>
              {line}
            </li>
          );
        })}
    </ul>
  );
  return (
    <div
      className={`d-flex justify-content-between py-2 status-box-row ${
        !last ? 'tv-table__row' : ''
      }`}
    >
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
