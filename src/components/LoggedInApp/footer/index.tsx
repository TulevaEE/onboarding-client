import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

export const Footer = () => {
  const { formatMessage } = useIntl();
  return (
    <footer className="mt-5 pt-4 pb-5 border-top app-footer">
      <address className="d-flex flex-wrap gap-4 row-gap-1 align-items-baseline justify-content-center small text-body-secondary">
        <strong>
          <FormattedMessage id="footer.name" />
        </strong>
        <FormattedMessage id="footer.address" />
        <a href={`mailto:${formatMessage({ id: 'footer.email' })}`}>
          <FormattedMessage id="footer.email" />
        </a>
        <a href={`tel:${formatMessage({ id: 'footer.phone.number' }).replace(/\s/g, '')}`}>
          <FormattedMessage id="footer.phone.number" />
        </a>
        <FormattedMessage id="footer.registration.code" />
      </address>
    </footer>
  );
};
