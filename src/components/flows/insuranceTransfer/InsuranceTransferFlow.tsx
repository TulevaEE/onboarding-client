import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useSelector } from 'react-redux';
import { Redirect, useLocation } from 'react-router-dom';
import ConnectedFlow, { FlowStep } from '../common/Flow';
import AddressStep from '../common/AddressStep';
import { useConversion } from '../../common/apiHooks';
import { usePageTitle } from '../../common/usePageTitle';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { hasAddress } from '../../common/user/address';
import { hasContactDetailsAmlCheck } from '../../aml';
import { State } from '../../../types';
import { InsuranceTransferStepPath, insuranceTransferSteps } from './insuranceTransferSteps';
import { InsuranceTransferSelection } from './InsuranceTransferSelection';
import { InsuranceTransferRequest } from './InsuranceTransferRequest';
import { InsuranceTransferDone } from './InsuranceTransferDone';

export const flowPath = '/3rd-pillar-insurance';

const useStepPathsFixedOnceLoaded = () => {
  const user = useSelector((state: State) => state.login.user);
  const missingAmlChecks = useSelector((state: State) => state.aml.missingAmlChecks);
  const { data: conversion, isFetching: refreshingConversion } = useConversion();
  const [stepPaths, setStepPaths] = useState<InsuranceTransferStepPath[] | null>(null);

  useEffect(() => {
    if (stepPaths || !user || !missingAmlChecks || !conversion || refreshingConversion) {
      return;
    }
    setStepPaths(
      insuranceTransferSteps({
        contactDetailsMissing: !hasAddress(user) || !hasContactDetailsAmlCheck(missingAmlChecks),
        selectionComplete: conversion.thirdPillar.selectionComplete,
      }),
    );
  }, [stepPaths, user, missingAmlChecks, conversion, refreshingConversion]);

  return stepPaths;
};

const toFlowStep = (path: InsuranceTransferStepPath, nextPath: string): FlowStep => {
  switch (path) {
    case 'contact-details':
      return {
        path,
        Component: () => <AddressStep nextPath={nextPath} updateOnlyEmailAndPhone pillar={3} />,
        title: <FormattedMessage id="thirdPillarFlow.steps.address.title" />,
      };
    case 'selection':
      return {
        path,
        Component: () => <InsuranceTransferSelection nextPath={nextPath} />,
        title: <FormattedMessage id="insuranceTransfer.steps.selection.title" />,
      };
    case 'request':
      return {
        path,
        Component: () => <InsuranceTransferRequest nextPath={nextPath} />,
        title: <FormattedMessage id="insuranceTransfer.steps.request.title" />,
      };
    case 'done':
      return { path, Component: () => <InsuranceTransferDone /> };
    default:
      throw new Error(`Unknown insurance transfer step: path=${path}`);
  }
};

export const InsuranceTransferFlow = () => {
  usePageTitle('pageTitle.thirdPillarInsurance');
  const { pathname, search } = useLocation();
  const stepPaths = useStepPathsFixedOnceLoaded();

  if (!stepPaths) {
    return (
      <div className="mt-4">
        <Shimmer height={400} />
      </div>
    );
  }

  const addressedStep = pathname.split('/').pop();
  if (!stepPaths.some((path) => path === addressedStep)) {
    return <Redirect to={{ pathname: `${flowPath}/${stepPaths[0]}`, search }} />;
  }

  const steps = stepPaths.map((path, index) =>
    toFlowStep(path, `${flowPath}/${stepPaths[index + 1] ?? path}`),
  );

  return <ConnectedFlow flowPath={flowPath} steps={steps} />;
};
