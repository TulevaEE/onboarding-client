import React from 'react';
import { Message } from 'retranslate';

const Separator = () => <span className="mx-2">·</span>;

const Footer = () => (
  <div className="row mt-4">
    <div className="col-12 px-0 mb-4">
      <hr />
    </div>
    <div className="col-12 text-center mb-4">
      <small className="text-muted">
        <b>
          <Message>footer.name</Message>
        </b>
        <Separator />
        <Message>footer.address</Message>
        <Separator />
        <Message>footer.email</Message>
        <Separator />
        <Message>footer.phone.number</Message>
        <Separator />
        <Message>footer.registration.code</Message>
      </small>
    </div>
  </div>
);

export default Footer;
