import React from 'react';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { StatusBoxTitle } from './StatusBoxTitle';

export const StatusBoxLoader: React.FunctionComponent = () => {
  return (
    <>
      <StatusBoxTitle />
      <div className="card card-secondary">
        <div className="d-flex p-2 status-box-row tv-table__row">
          <Shimmer height={52} />
        </div>
        <div className="d-flex p-2 status-box-row tv-table__row">
          <Shimmer height={52} />
        </div>
        <div className="d-flex p-2 status-box-row">
          <Shimmer height={52} />
        </div>
      </div>
      <div className="mt-4">
        <Shimmer height={16} />
      </div>
    </>
  );
};
