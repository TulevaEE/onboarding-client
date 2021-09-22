import React from 'react';
import { Message } from 'retranslate';

export const StatusBoxTitle: React.FunctionComponent = () => {
  return (
    <div className="row">
      <div className="col-md-6 mb-4 lead">
        <Message>account.status.choices</Message>
      </div>
    </div>
  );
};
