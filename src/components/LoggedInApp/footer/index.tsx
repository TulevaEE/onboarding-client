import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

const Separator = () => <span className="mx-2 text-body-secondary">·</span>;

export const Footer = () => {
  const { formatMessage } = useIntl();
  return (
    <footer className="mt-5 pt-4 pb-5 border-top small text-center text-body-secondary app-footer">
      <address>
        <strong>
          <FormattedMessage id="footer.name" />
        </strong>
        <Separator />
        <FormattedMessage id="footer.address" />
        <Separator />
        <a href={`mailto:${formatMessage({ id: 'footer.email' })}`}>
          <FormattedMessage id="footer.email" />
        </a>
        <Separator />
        <a href={`tel:${formatMessage({ id: 'footer.phone.number' }).replace(/\s/g, '')}`}>
          <FormattedMessage id="footer.phone.number" />
        </a>
        <Separator />
        <FormattedMessage id="footer.registration.code" />
      </address>
    </footer>
  );
};
