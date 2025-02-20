import React from 'react';
import { FormattedMessage } from 'react-intl';

const Separator = () => <span className="mx-2 text-body-secondary">·</span>;

export const Footer = () => (
  <footer className="mt-5 pt-4 pb-5 border-top small text-center text-body-secondary app-footer">
    <address>
      <strong>
        <FormattedMessage id="footer.name" />
      </strong>
      <Separator />
      <FormattedMessage id="footer.address" />
      <Separator />
      <FormattedMessage id="footer.email">
        {(email) => <a href={`mailto:${email}`}>{email}</a>}
      </FormattedMessage>
      <Separator />
      <FormattedMessage id="footer.phone.number">
        {(phone) => {
          const phoneString = typeof phone === 'string' ? phone : String(phone);
          const cleanedPhoneNumber = phoneString.replace(/\s/g, '');
          return <a href={`tel:${cleanedPhoneNumber}`}>{phone}</a>;
        }}
      </FormattedMessage>
      <Separator />
      <FormattedMessage id="footer.registration.code" />
    </address>
  </footer>
);
