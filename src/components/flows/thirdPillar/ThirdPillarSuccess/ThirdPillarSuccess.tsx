import React from 'react';
import { FormattedMessage } from 'react-intl';
import { SuccessNotice } from '../../common/SuccessNotice/SuccessNotice';
import { Shimmer } from '../../../common/shimmer/Shimmer';
import { usePendingApplications } from '../../../common/apiHooks';
import { hasPendingThirdPillarTransfer } from '../pendingTransfer';
import { Nudge } from '../../../common/nudge/Nudge';

export const ThirdPillarSuccess = () => {
  const { data: pendingApplications, isLoading: applicationsLoading } = usePendingApplications();

  if (applicationsLoading) {
    return <Shimmer height={26} />;
  }

  const transferPending = pendingApplications
    ? hasPendingThirdPillarTransfer(pendingApplications)
    : false;

  return (
    <>
      <SuccessNotice>
        <h2 className="text-center mt-3">
          <FormattedMessage id="thirdPillarSuccess.done" />
        </h2>
        <p className="mt-5">
          <FormattedMessage id="thirdPillarSuccess.message" />
        </p>
        {transferPending && (
          <p>
            <FormattedMessage id="thirdPillarSuccess.transfer.message" />
          </p>
        )}
        <p>
          <FormattedMessage id="thirdPillarSuccess.message.topSavers" />
        </p>
        <a className="btn btn-outline-primary mt-4 profile-link" href="/account">
          <FormattedMessage id="thirdPillarSuccess.button.account" />
        </a>
      </SuccessNotice>
      <Nudge context="THIRD_PILLAR_PAYMENT" />
    </>
  );
};

export default ThirdPillarSuccess;
