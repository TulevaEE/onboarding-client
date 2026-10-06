import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

export const RejoinDisclaimers = ({ className = '' }: { className?: string }) => (
  <div role="note" className={`small text-secondary ${className}`.trim()}>
    <p className="mb-1">
      <FormattedMessage
        id="secondPillarGrowth.firstPillarNote"
        values={{
          a: (chunks: string) => (
            <Link to="/1st-vs-2nd-pillar" className="text-secondary">
              {chunks}
            </Link>
          ),
        }}
      />
    </p>
    <p className="mb-0">
      <FormattedMessage id="secondPillarRejoin.restriction.summary" />
    </p>
  </div>
);
