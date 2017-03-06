import React from 'react';
import { Message } from 'retranslate';

import successImage from './success.svg';
import './Success.scss';

const Success = () => (
  <div className="row">
    <div className="col-12 mt-5 px-0">
      <div className="alert alert-success text-center pt-5 pb-5">
        <div className="tv-success__container">
          <img src={successImage} alt="Success" className="tv-success__check" />
        </div>
        <h2 className="text-center mt-3"><Message>success.done</Message></h2>
        <p className="mt-4">
          <Message>success.your.payments</Message>
          <b><Message>success.your.payments.next.payment</Message></b>.
        </p>
        <p>
          <Message>success.shares.switched</Message>
          <b><Message>success.shares.switched.when</Message></b>.
        </p>
      </div>
    </div>
  </div>
);

export default Success;
