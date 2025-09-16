import React from 'react';

// TODO refactor props to union type of 'SUCCESS' | 'ERROR' | 'WARNING'
const StatusBoxIcon: React.FunctionComponent<{
  checked?: boolean;
  warning?: boolean;
  error?: boolean;
}> = ({ checked = false, warning = false, error = false }) => {
  if (error) {
    return (
      <div className="status-box-icon" data-testid="status-icon-error" aria-hidden="true">
        <svg
          fill="none"
          height="24"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            clipRule="evenodd"
            d="m1 12c0-6.07513 4.92487-11 11-11 6.0751 0 11 4.92487 11 11 0 6.0751-4.9249 11-11 11-6.07513 0-11-4.9249-11-11z"
            fill="#ff4614"
            fillRule="evenodd"
          />
          <path
            clipRule="evenodd"
            d="m8.00001 8.00006c.39053-.39052 1.02369-.39052 1.41422 0l2.58577 2.58574 2.5858-2.58575c.3905-.39053 1.0237-.39053 1.4142 0 .3905.39052.3905 1.02369 0 1.41421l-2.5858 2.58574 2.5858 2.5858c.3905.3906.3905 1.0237 0 1.4142-.3905.3906-1.0237.3906-1.4142 0l-2.5858-2.5858-2.5858 2.5858c-.39053.3906-1.02369.3906-1.41422 0-.39052-.3905-.39052-1.0237 0-1.4142l2.58582-2.5858-2.58579-2.58573c-.39052-.39052-.39052-1.02368 0-1.41421z"
            fill="#fff"
            fillRule="evenodd"
          />
          <path
            d="m14.504 7.73743c.4909-.40041 1.2152-.3717 1.6728.08593l.086.09473c.3737.45823.3737 1.1199 0 1.57813l-.086.09472-2.4092 2.40916 2.4092 2.4092.086.0947c.3736.4583.3737 1.12 0 1.5782l-.086.0947c-.4576.4576-1.1819.4863-1.6728.0859l-.0948-.0859-2.4091-2.4092-2.40922 2.4092c-.45764.4575-1.18191.4863-1.67285.0859l-.09473-.0859c-.48812-.4881-.48807-1.2794 0-1.7676l2.4092-2.4092-2.4092-2.40916c-.48813-.48815-.48814-1.27943 0-1.76758l.09473-.08593c.49096-.40049 1.21519-.37171 1.67285.08593l2.40922 2.40914 2.4091-2.40914z"
            stroke="#000"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity=".16"
            strokeWidth=".5"
          />
        </svg>
      </div>
    );
  }

  if (warning) {
    return (
      <div className="status-box-icon" data-testid="status-icon-warning" aria-hidden="true">
        <svg
          fill="none"
          height="24"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            clipRule="evenodd"
            d="m1 12c0-6.07513 4.92487-11 11-11 6.0751 0 11 4.92487 11 11 0 6.0751-4.9249 11-11 11-6.07513 0-11-4.9249-11-11z"
            fill="#ffa500"
            fillRule="evenodd"
          />
          <path
            d="m13.25 16c0 .6904-.5596 1.25-1.25 1.25s-1.25-.5596-1.25-1.25.5596-1.25 1.25-1.25 1.25.5596 1.25 1.25z"
            fill="#fff"
          />
          <path
            d="m10.8391 7.99682c-.0482-.67374.4854-1.24682 1.1609-1.24682s1.2091.57308 1.1609 1.24682l-.3575 5.00508c-.0301.4215-.3808.7481-.8034.7481s-.7733-.3266-.8034-.7481z"
            fill="#fff"
          />
          <path
            d="m12 14.5c.8284 0 1.5.6716 1.5 1.5s-.6716 1.5-1.5 1.5-1.5-.6716-1.5-1.5.6716-1.5 1.5-1.5zm0-8c.7691 0 1.3868.61163 1.4131 1.3623l-.0029.15235-.3575 5.00485c-.0394.5524-.499.9805-1.0527.9805-.5191 0-.9559-.3759-1.041-.8779l-.0117-.1026-.3575-5.00485c-.0584-.81846.5897-1.51465 1.4102-1.51465z"
            stroke="#000"
            strokeOpacity=".24"
            strokeWidth=".5"
          />
        </svg>
      </div>
    );
  }

  if (checked) {
    return (
      <div className="status-box-icon" data-testid="status-icon-success" aria-hidden="true">
        <svg
          fill="none"
          height="24"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            clipRule="evenodd"
            d="m1 12c0-6.07513 4.92487-11 11-11 6.0751 0 11 4.92487 11 11 0 6.0751-4.9249 11-11 11-6.07513 0-11-4.9249-11-11z"
            fill="#00a100"
            fillRule="evenodd"
          />
          <path
            clipRule="evenodd"
            d="m17.2071 8.29289c.3905.39053.3905 1.02369 0 1.41422l-6 5.99999c-.3905.3905-1.0237.3905-1.41421 0l-3-3c-.39052-.3905-.39052-1.0237 0-1.4142.39053-.3905 1.02369-.3905 1.41422 0l2.29289 2.2929 5.2929-5.29291c.3905-.39052 1.0237-.39052 1.4142 0z"
            fill="#fff"
            fillRule="evenodd"
          />
          <path
            d="m15.7109 8.03027c.491-.40048 1.2152-.37172 1.6729.08594l.0859.09473c.3738.45825.3738 1.11987 0 1.57812l-.0859.09473-6 6.00001c-.4577.4577-1.1819.4864-1.67286.0859l-.09473-.0859-3-3c-.48815-.4882-.48815-1.2794 0-1.7676l.09473-.0859c.49097-.4005 1.21519-.3718 1.67285.0859l2.11621 2.1162 5.1162-5.11619z"
            stroke="#000"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity=".16"
            strokeWidth=".5"
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
}> = ({
  name = '',
  lines = [],
  showAction = false,
  ok = false,
  warning = false,
  error = false,
  children = '',
  last = false,
}) => (
  <div className={`status-box-row ${!last ? 'tv-table__row' : ''}`} data-testid="status-box-row">
    <div className="d-flex gap-3 flex-column flex-sm-row justify-content-between p-3">
      <div className="d-flex gap-3">
        <StatusBoxIcon checked={ok} warning={warning} error={error} />
        <div className="d-flex flex-column justify-content-center">
          <h3 className="mb-1 h4">{name}</h3>
          {lines.map((line) => (
            <p className="m-0">{line}</p>
          ))}
        </div>
      </div>
      {showAction && children && (
        <div className="d-flex flex-column justify-content-center text-nowrap">{children}</div>
      )}
    </div>
  </div>
);

export default StatusBoxRow;
