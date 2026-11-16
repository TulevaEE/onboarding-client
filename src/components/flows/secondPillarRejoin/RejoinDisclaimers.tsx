import { FormattedMessage } from 'react-intl';

export const RejoinDisclaimers = ({ className = '' }: { className?: string }) => (
  <p role="note" className={`mb-0 ${className}`}>
    <FormattedMessage id="secondPillarRejoin.restriction.summary" />
  </p>
);
