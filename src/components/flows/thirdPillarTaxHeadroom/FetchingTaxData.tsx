import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Loader } from '../../common/loader/Loader';

export const FetchingTaxData = () => (
  <div className="tv-modal">
    <div className="col-12 col-sm-10 col-md-7 col-lg-5 mx-auto mt-4 pt-4 px-3">
      <div className="bg-white shadow-sm rounded-3 p-5 text-center" role="status">
        <p className="m-0 mb-4 text-balance">
          <FormattedMessage id="thirdPillarTaxHeadroom.consent.fetching" />
        </p>
        <Loader className="align-middle" />
      </div>
    </div>
  </div>
);
