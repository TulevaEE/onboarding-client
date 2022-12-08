import React from 'react';
import './StatusBoxRow.scss';

const CheckMark: React.FunctionComponent<{
  checked?: boolean;
  warning?: boolean;
  error?: boolean;
}> = ({ checked = false, warning = false, error = false }) => (
  <div
    className={`ml-3 mr-2 fa${checked ? ' fa-check' : ''}${error ? ' fa-times' : ''}${
      warning ? ' fa-exclamation-triangle' : ''
    }`}
  />
);

export const StatusBoxRow: React.FunctionComponent<{
  name?: React.ReactNode;
  lines?: React.ReactNode[];
  showAction?: boolean;
  ok?: boolean;
  warning?: boolean;
  error?: boolean;
  last?: boolean;
  children?: React.ReactNode;
}> = ({
  name = '',
  lines = [],
  showAction = false,
  ok = false,
  warning = false,
  error = false,
  children = '',
  last = false,
}) => {
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
      className={`d-flex flex-sm-row flex-column justify-content-between py-2 status-box-row ${
        !last ? 'tv-table__row' : ''
      }`}
    >
      <div className="d-flex">
        <div className="d-flex flex-column justify-content-center">
          <CheckMark checked={ok} warning={warning} error={error} />
        </div>
        <div className="d-flex flex-column justify-content-center">
          <div className="mt-0 pt-1 pl-2">
            <b>{name}</b>
          </div>
          {formattedLines}
        </div>
      </div>
      <div className="d-flex flex-column justify-content-center my-2 mx-3 text-nowrap">
        {showAction && children ? children : ''}
      </div>
    </div>
  );
};

export default StatusBoxRow;
