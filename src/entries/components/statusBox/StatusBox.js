import React, { Fragment } from 'react';
import { Message } from 'retranslate';
import StatusBoxRow from './statusBoxRow';

export const StatusBox = () => (
  <Fragment>
    <div className="row ">
      <div className="col-12">
        <div className="px-col mb-4">
          <p className="mb-4 lead">
            <Message>account.status.choices</Message>
          </p>
        </div>
      </div>
    </div>
    <div className="card card-secondary p-4">
      <StatusBoxRow ok name={<Message>account.status.choice.pillar.second</Message>} />
      <StatusBoxRow ok={!true} name={<Message>account.status.choice.pillar.third</Message>} />
      <StatusBoxRow ok name={<Message>account.status.choice.tuleva</Message>} />
    </div>
  </Fragment>
);
