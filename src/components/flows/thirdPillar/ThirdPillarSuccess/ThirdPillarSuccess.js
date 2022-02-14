import React from 'react';
import { FormattedMessage } from 'react-intl';
import { SuccessNotice } from '../../common/SuccessNotice/SuccessNotice';

export const ThirdPillarSuccess = () => (
  <div className="row">
    <div className="col-12 px-0">
      <SuccessNotice>
        <h2 className="text-center mt-3">
          <FormattedMessage id="thirdPillarSuccess.done" />
        </h2>
        <p className="mt-5">
          <FormattedMessage id="thirdPillarSuccess.message" />
        </p>
        <a className="btn btn-primary mt-4 profile-link" href="/account">
          <FormattedMessage id="thirdPillarSuccess.button" />
        </a>
      </SuccessNotice>
    </div>
  </div>
);

export default ThirdPillarSuccess;
