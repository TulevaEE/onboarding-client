import React from 'react';
import { FormattedMessage } from 'react-intl';

const Separator = () => <span className="mx-2">·</span>;

const Footer = () => (
  <div className="row mt-4">
    <div className="col-12 px-0 mb-4">
      <hr />
    </div>
    <div className="col-12 text-center mb-4">
      <small className="text-muted">
        <b>
          <FormattedMessage id="footer.name" />
        </b>
        <Separator />
        <FormattedMessage id="footer.address" />
        <Separator />
        <FormattedMessage id="footer.email" />
        <Separator />
        <FormattedMessage id="footer.phone.number" />
        <Separator />
        <FormattedMessage id="footer.registration.code" />
      </small>
    </div>
  </div>
);

export default Footer;
