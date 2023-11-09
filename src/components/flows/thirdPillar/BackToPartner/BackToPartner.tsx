import React from 'react';
import { FormattedMessage } from 'react-intl';
import { SuccessNotice } from '../../common/SuccessNotice/SuccessNotice';
import { Notice } from '../../common/Notice/Notice';
import { finish as finishProcedure } from '../../../TriggerProcedure/utils';

export const BackToPartner: React.FC = () => {
  return (
    <>
      <div className="row mt-5">
        <div className="col-12 px-0">
          <SuccessNotice>
            <h2 className="text-center mt-3">
              <FormattedMessage id="thirdPillarBackToPartner.opened" />
            </h2>
          </SuccessNotice>
        </div>
      </div>
      <div className="row">
        <div className="col-12 px-0">
          <Notice>
            <h2 className="mt-0 text-center">
              <FormattedMessage id="thirdPillarBackToPartner.automateNext" />
            </h2>
            <p className="mt-3">
              <FormattedMessage id="thirdPillarBackToPartner.automateNext.subtitle" />
            </p>
            <button
              type="button"
              className="btn btn-block d-md-inline btn-primary mt-4 profile-link"
              onClick={() => finishProcedure('success')}
            >
              <FormattedMessage id="thirdPillarBackToPartner.recurringPayment.button" />
            </button>
            <p className="mt-2 mb-0">
              <small className="text-muted">
                <FormattedMessage id="thirdPillarBackToPartner.recurringPayment.subtitle" />
              </small>
            </p>
          </Notice>
        </div>
      </div>
    </>
  );
};

export default BackToPartner;
