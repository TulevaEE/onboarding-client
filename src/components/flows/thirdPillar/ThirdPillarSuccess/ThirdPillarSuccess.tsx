import React from 'react';
import { FormattedMessage } from 'react-intl';
import { SuccessNotice } from '../../common/SuccessNotice/SuccessNotice';
import { Shimmer } from '../../../common/shimmer/Shimmer';
import { useConversion, useMe, usePendingApplications } from '../../../common/apiHooks';
import {
  hasPendingThirdPillarTransfer,
  secondPillarSuggestion,
} from '../secondPillarNudge/secondPillarSuggestion';
import { SecondPillarNudge } from '../secondPillarNudge/SecondPillarNudge';

export const ThirdPillarSuccess = () => {
  const { data: conversion, isLoading: conversionLoading } = useConversion();
  const { data: user, isLoading: userLoading } = useMe();
  const { data: pendingApplications, isLoading: applicationsLoading } = usePendingApplications();

  if (conversionLoading || userLoading || applicationsLoading) {
    return <Shimmer height={26} />;
  }

  const suggestion =
    user && conversion && pendingApplications
      ? secondPillarSuggestion(user, conversion.secondPillar, pendingApplications)
      : undefined;
  const supportOnly = !suggestion || suggestion === 'NONE' || suggestion === 'PENDING_TRANSFER';

  return (
    <>
      <SupportNotice
        isTransferIn={
          pendingApplications ? hasPendingThirdPillarTransfer(pendingApplications) : false
        }
        showAccountButton={supportOnly}
      />
      <SecondPillarNudge />
    </>
  );
};

const SupportNotice = ({
  isTransferIn,
  showAccountButton,
}: {
  isTransferIn: boolean;
  showAccountButton: boolean;
}) => (
  <SuccessNotice>
    <h2 className="text-center mt-3">
      <FormattedMessage
        id={isTransferIn ? 'thirdPillarSuccess.transfer.done' : 'thirdPillarSuccess.done'}
      />
    </h2>
    <p className="mt-5">
      <FormattedMessage
        id={isTransferIn ? 'thirdPillarSuccess.transfer.message' : 'thirdPillarSuccess.message'}
      />
    </p>
    {showAccountButton && (
      <a className="btn btn-primary mt-4 profile-link" href="/account">
        <FormattedMessage id="thirdPillarSuccess.button.account" />
      </a>
    )}
  </SuccessNotice>
);

export default ThirdPillarSuccess;
