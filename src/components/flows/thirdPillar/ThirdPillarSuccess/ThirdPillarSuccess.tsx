import React from 'react';
import { FormattedMessage } from 'react-intl';
import { SuccessNotice } from '../../common/SuccessNotice/SuccessNotice';
import { Shimmer } from '../../../common/shimmer/Shimmer';
import { usePendingApplications } from '../../../common/apiHooks';
import { hasPendingThirdPillarTransfer } from '../pendingTransfer';
import { Nudge } from '../../../common/nudge/Nudge';
import { PaymentDoneMessage } from './PaymentDoneMessage';

export const ThirdPillarSuccess = () => {
  const { data: pendingApplications, isLoading: applicationsLoading } = usePendingApplications();

  if (applicationsLoading) {
    return <Shimmer height={26} />;
  }

  return (
    <>
      <SupportNotice
        isTransferIn={
          pendingApplications ? hasPendingThirdPillarTransfer(pendingApplications) : false
        }
      />
      <Nudge context="THIRD_PILLAR_PAYMENT" />
    </>
  );
};

const SupportNotice = ({ isTransferIn }: { isTransferIn: boolean }) => (
  <SuccessNotice>
    <h2 className="text-center mt-3">
      <FormattedMessage
        id={isTransferIn ? 'thirdPillarSuccess.transfer.done' : 'thirdPillarSuccess.done'}
      />
    </h2>
    {isTransferIn ? (
      <p className="mt-5">
        <FormattedMessage id="thirdPillarSuccess.transfer.message" />
      </p>
    ) : (
      <PaymentDoneMessage />
    )}
    <a className="btn btn-primary mt-4 profile-link" href="/account">
      <FormattedMessage id="thirdPillarSuccess.button.account" />
    </a>
  </SuccessNotice>
);

export default ThirdPillarSuccess;
