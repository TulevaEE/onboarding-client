import React from 'react';
import { Message } from 'retranslate';
import successImage from './success.svg';
import './ThirdPillarSuccess.scss';

export const ThirdPillarSuccess = () => (
  <div className="row">
    <div className="col-12 px-0">
      <div className="alert alert-success text-center pt-5 pb-5">
        <div className="tv-success__container">
          <img src={successImage} alt="Success" className="tv-success__check" />
        </div>
        <h2 className="text-center mt-3">
          <Message>thirdPillarSuccess.done</Message>
        </h2>
        <p className="mt-5">
          <Message>thirdPillarSuccess.message</Message>
        </p>
        <a className="btn btn-primary mt-4 profile-link" href="/account">
          <Message>thirdPillarSuccess.button</Message>
        </a>
      </div>
    </div>
  </div>
);

export default ThirdPillarSuccess;
