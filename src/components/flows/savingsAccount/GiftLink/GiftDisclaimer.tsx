import { FC, ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

// An investment fund, not a pension fund: the disclaimer has to carry the investor rights summary,
// and the page talks about growth, so it carries the returns sentence too.
export const GiftDisclaimer: FC = () => (
  <p className="m-0 small text-body-secondary text-center">
    <FormattedMessage
      id="giftLink.disclaimer"
      values={{
        a: (chunks: ReactNode) => (
          <a className="text-body-secondary" href="https://tuleva.ee">
            {chunks}
          </a>
        ),
        mail: (chunks: ReactNode) => (
          <a className="text-body-secondary" href="mailto:tuleva@tuleva.ee">
            {chunks}
          </a>
        ),
        tel: (chunks: ReactNode) => (
          <a className="text-body-secondary" href="tel:+3726445100">
            {chunks}
          </a>
        ),
      }}
    />
  </p>
);
