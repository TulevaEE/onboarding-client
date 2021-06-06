/* eslint-disable react/no-array-index-key */

import React from 'react';
import { Message } from 'retranslate';

import { logo } from '../common';

const TermsOfUse = () => (
  <div className="container pt-5">
    <div className="row">
      <div className="col-lg-12 text-center">
        <img src={logo} alt="Tuleva" className="img-responsive brand-logo mb-3 pb-3 mt-2" />
      </div>
    </div>
    <div className="row">
      <div className="col">
        <h4>
          <Message>terms.of.use.title</Message>
        </h4>

        <p className="mt-3">
          <Message>terms.of.use.subheading</Message>
        </p>

        <ol className="mt-3">
          {[...Array(7)].map((item, index) => (
            <li key={index}>
              <Message>{`terms.of.use.list.item.${index + 1}`}</Message>
            </li>
          ))}
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
        <p className="mt-3">
          <a
            href="https://drive.google.com/open?id=1IKm6NldgI1lu01X2rvCMy9B78wNANh81z3_wvVEKtM4"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Message>terms.of.use.main.line.4</Message>
          </a>
        </p>
      </div>
    </div>
  </div>
);

export default TermsOfUse;
