import React from 'react';
import { FormattedMessage } from 'react-intl';

const Separator = () => <span className="mx-2 text-secondary">·</span>;

export const Footer = () => (
  <div className="mt-5 pt-4 pb-5 border-top small text-center text-secondary app-footer">
    <strong>
      <FormattedMessage id="footer.name" />
    </strong>
    <Separator />
    <FormattedMessage id="footer.address" />
    <Separator />
    <FormattedMessage id="footer.email" />
    <Separator />
    <FormattedMessage id="footer.phone.number" />
    <Separator />
    <FormattedMessage id="footer.registration.code" />
  </div>
);
