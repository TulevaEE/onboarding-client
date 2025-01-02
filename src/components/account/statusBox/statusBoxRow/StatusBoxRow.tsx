import React from 'react';
import './StatusBoxRow.scss';

const Checkmark: React.FunctionComponent<{
  checked?: boolean;
  warning?: boolean;
  error?: boolean;
}> = ({ checked = false, warning = false, error = false }) => {
  if (error) {
    return (
      <div className="ml-3 mr-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none">
          <path
            fill="#FF4800"
            fillRule="evenodd"
            d="M1 12C1 5.925 5.925 1 12 1s11 4.925 11 11-4.925 11-11 11S1 18.075 1 12Z"
            clipRule="evenodd"
          />
          <path
            fill="#fff"
            fillRule="evenodd"
            d="M8 8a1 1 0 0 1 1.414 0L12 10.586 14.586 8A1 1 0 1 1 16 9.414L13.414 12 16 14.586A1 1 0 0 1 14.586 16L12 13.414 9.414 16A1 1 0 1 1 8 14.586L10.586 12 8 9.414A1 1 0 0 1 8 8Z"
            clipRule="evenodd"
          />
          <path
            stroke="#000"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity=".08"
            strokeWidth=".5"
            d="M9.591 7.823a1.25 1.25 0 0 0-1.768 1.768L10.233 12l-2.41 2.409a1.25 1.25 0 0 0 1.768 1.768L12 13.767l2.409 2.41a1.25 1.25 0 1 0 1.768-1.768L13.767 12l2.41-2.409L16 9.414l.177.177a1.25 1.25 0 0 0-1.768-1.768L12 10.233l-2.409-2.41Z"
          />
        </svg>
      </div>
    );
  }

  if (warning) {
    return (
      <div className="ml-3 mr-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none">
          <path
            fill="#F8AF18"
            fillRule="evenodd"
            d="M1 12C1 5.925 5.925 1 12 1s11 4.925 11 11-4.925 11-11 11S1 18.075 1 12Z"
            clipRule="evenodd"
          />
          <circle cx="12" cy="16" r="1.25" fill="#fff" />
          <circle cx="12" cy="16" r="1.5" stroke="#000" strokeOpacity=".08" strokeWidth=".5" />
          <path
            fill="#fff"
            d="M10.84 7.997a1.164 1.164 0 1 1 2.32 0l-.357 5.005a.805.805 0 0 1-1.606 0l-.358-5.005Z"
          />
          <path
            stroke="#000"
            strokeOpacity=".08"
            strokeWidth=".5"
            d="M12 6.5c-.82 0-1.469.696-1.41 1.515l.357 5.005a1.056 1.056 0 0 0 2.106 0l.357-5.005A1.414 1.414 0 0 0 12 6.5Z"
          />
        </svg>
      </div>
    );
  }

  if (checked) {
    return (
      <div className="ml-3 mr-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none">
          <path
            fill="#51C26C"
            fillRule="evenodd"
            d="M1 12C1 5.925 5.925 1 12 1s11 4.925 11 11-4.925 11-11 11S1 18.075 1 12Z"
            clipRule="evenodd"
          />
          <path
            fill="#fff"
            fillRule="evenodd"
            d="M17.207 8.293a1 1 0 0 1 0 1.414l-6 6a1 1 0 0 1-1.414 0l-3-3a1 1 0 1 1 1.414-1.414l2.293 2.293 5.293-5.293a1 1 0 0 1 1.414 0Z"
            clipRule="evenodd"
          />
          <path
            stroke="#000"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity=".08"
            strokeWidth=".5"
            d="M17.384 9.884a1.25 1.25 0 0 0-1.768-1.768L10.5 13.232l-2.116-2.116a1.25 1.25 0 0 0-1.768 1.768l3 3a1.25 1.25 0 0 0 1.768 0l6-6Z"
          />
        </svg>
      </div>
    );
  }

  return null;
};

export const StatusBoxRow: React.FunctionComponent<{
  name?: React.ReactNode;
  lines?: React.ReactNode[];
  showAction?: boolean;
  ok?: boolean;
  warning?: boolean;
  error?: boolean;
  last?: boolean;
  children?: React.ReactNode;
  extraBottom?: React.ReactNode;
}> = ({
  name = '',
  lines = [],
  showAction = false,
  ok = false,
  warning = false,
  error = false,
  children = '',
  last = false,
  extraBottom = <></>,
}) => {
  const formattedLines = (
    <ul>
      {lines &&
        lines.length > 0 &&
        lines.map((line, i) => (
          <li className="pl-2" key={i}>
            {line}
          </li>
        ))}
    </ul>
  );
  return (
    <div className={`py-2 status-box-row ${!last ? 'tv-table__row' : ''}`}>
      <div className="d-flex flex-sm-row flex-column justify-content-between">
        <div className="d-flex">
          <div className="d-flex flex-column justify-content-center">
            <Checkmark checked={ok} warning={warning} error={error} />
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
      {extraBottom}
    </div>
  );
};

export default StatusBoxRow;
