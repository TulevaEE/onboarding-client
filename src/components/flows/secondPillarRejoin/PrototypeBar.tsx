import { FormattedMessage, useIntl } from 'react-intl';
import { View } from './variants';

const VIEW_OPTIONS = [
  { value: 'application', labelId: 'secondPillarRejoin.prototype.view.application' },
  { value: 'calculator', labelId: 'secondPillarRejoin.prototype.view.calculator' },
] as const;

export const PrototypeBar = ({
  view,
  onViewChange,
}: {
  view: View;
  onViewChange: (view: View) => void;
}) => {
  const { formatMessage } = useIntl();

  return (
    <div className="alert alert-warning small mb-5">
      <p className="fw-bold mb-2">
        <FormattedMessage id="secondPillarRejoin.prototype.notice" />
      </p>
      <div
        className="btn-group btn-group-sm flex-wrap"
        role="group"
        aria-label={formatMessage({ id: 'secondPillarRejoin.prototype.view' })}
      >
        {VIEW_OPTIONS.map(({ value, labelId }) => (
          <button
            key={value}
            type="button"
            className={`btn ${value === view ? 'btn-dark' : 'btn-outline-dark'}`}
            aria-pressed={value === view}
            onClick={() => onViewChange(value)}
          >
            <FormattedMessage id={labelId} />
          </button>
        ))}
      </div>
    </div>
  );
};
