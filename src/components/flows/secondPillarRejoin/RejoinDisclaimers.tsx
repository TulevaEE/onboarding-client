import { FormattedMessage } from 'react-intl';

export const RejoinDisclaimers = ({ className = '' }: { className?: string }) => (
  <div role="note" className={`small text-secondary ${className}`.trim()}>
    <p className="mb-1">
      <FormattedMessage id="secondPillarRejoin.firstPillarNote" />
    </p>
    <p className="mb-0">
      <FormattedMessage id="secondPillarRejoin.restriction.summary" />
    </p>
  </div>
);
