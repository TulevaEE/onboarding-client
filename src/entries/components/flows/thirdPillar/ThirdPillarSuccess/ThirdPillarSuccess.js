import React from 'react';
import { Message } from 'retranslate';
import { SuccessNotice } from '../../common/SuccessNotice/SuccessNotice';

export const ThirdPillarSuccess = () => (
  <div className="row">
    <div className="col-12 px-0">
      <SuccessNotice>
        <h2 className="text-center mt-3">
          <Message>thirdPillarSuccess.done</Message>
        </h2>
        <p className="mt-5">
          <Message>thirdPillarSuccess.message</Message>
        </p>
        <a className="btn btn-primary mt-4 profile-link" href="/account">
          <Message>thirdPillarSuccess.button</Message>
        </a>
      </SuccessNotice>
    </div>
  </div>
);

export default ThirdPillarSuccess;
