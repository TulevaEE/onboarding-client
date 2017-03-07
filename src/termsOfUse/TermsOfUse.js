import React from 'react';
import { Message } from 'retranslate';

import { logo } from '../common';

export const TermsOfUse = () => (
  <div className="container pt-5">
    <div className="row">
      <div className="col-lg-12 text-center">
        <img src={logo} alt="Tuleva" className="img-responsive brand-logo mb-3 pb-3 mt-2" />
      </div>
    </div>
    <div className="row">
      <h4><Message>terms.of.use.title</Message></h4>

      <p className="mt-3"><Message>terms.of.use.subheading</Message></p>

      <ol className="mt-3">
        <li>
          <Message>terms.of.use.list.item.1</Message>
        </li>
        <li>
          <Message>terms.of.use.list.item.2</Message>
        </li>
        <li>
          <Message>terms.of.use.list.item.3</Message>
        </li>
        <li>
          <Message>terms.of.use.list.item.4</Message>
        </li>
        <li>
          <Message>terms.of.use.list.item.5</Message>
        </li>
        <li>
          <Message>terms.of.use.list.item.6</Message>
        </li>
      </ol>

      <p className="mt-3">
        <Message>terms.of.use.main.line.1</Message>
      </p>

      <p className="mt-3">
        <Message>terms.of.use.main.line.2</Message>
      </p>

      <p className="mt-3">
        <Message>terms.of.use.main.line.3</Message>
      </p>
    </div>
  </div>
);

export default TermsOfUse;
