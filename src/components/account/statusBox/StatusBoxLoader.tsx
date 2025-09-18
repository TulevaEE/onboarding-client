import React from 'react';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { StatusBoxTitle } from './StatusBoxTitle';

export const StatusBoxLoader: React.FunctionComponent = () => (
  <>
    <StatusBoxTitle />
    <div className="card card-secondary">
      <div className="d-flex p-3 status-box-row tv-table__row">
        <Shimmer height={76} />
      </div>
      <div className="d-flex p-3 status-box-row tv-table__row">
        <Shimmer height={76} />
      </div>
      <div className="d-flex p-3 status-box-row">
        <Shimmer height={76} />
      </div>
    </div>
  </>
);
