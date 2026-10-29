import React from 'react';
import { FormattedMessage } from 'react-intl';

const paragraph = (chunks: React.ReactNode) => <p className="mb-2">{chunks}</p>;

export const ProviderDisclaimer = () => (
  // Mandatory for a fund communication: who provides the service, where the
  // prospectus and key information are, the invitation to read the terms and
  // take advice, and the tax-changes-over-time clause. ReklS para 3 lg 2 and
  // para 29 lg 2, IFS para 80 lg 4, and the Tuleva teavitustegevuste eeskiri
  // p 7 and p 8.
  <div className="form-text" data-testid="disclaimer">
    <FormattedMessage
      id="pensionCalculator.provider"
      values={{
        p: paragraph,
        // Dark like the page footer's links, so the muted block stays muted.
        a: (chunks: React.ReactNode) => (
          <a className="text-body-secondary" href="https://tuleva.ee">
            {chunks}
          </a>
        ),
        mail: (chunks: React.ReactNode) => (
          <a className="text-body-secondary" href="mailto:tuleva@tuleva.ee">
            {chunks}
          </a>
        ),
        tel: (chunks: React.ReactNode) => (
          <a className="text-body-secondary" href="tel:+3726445100">
            {chunks}
          </a>
        ),
      }}
    />
    <FormattedMessage id="pensionCalculator.disclaimer" values={{ p: paragraph }} />
  </div>
);
