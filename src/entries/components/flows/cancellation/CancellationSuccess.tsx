import React from 'react';
import { Message } from 'retranslate';
import { SuccessNotice } from '../common/SuccessNotice';

export const CancellationSuccess: React.FunctionComponent<unknown> = () => (
  <div className="row">
    <div className="col-12 mt-5 px-0">
      <SuccessNotice>
        <h2 className="text-center mt-3">
          <Message>cancellation.flow.success.title</Message>
        </h2>
      </SuccessNotice>
      <a className="btn btn-primary mt-4 profile-link" href="/account">
        <Message>cancellation.flow.success.back</Message>
      </a>
    </div>
  </div>
);
