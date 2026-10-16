import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useSelector } from 'react-redux';
import { Redirect, useHistory, useLocation } from 'react-router-dom';
import ConnectedFlow, { FlowStep } from '../common/Flow';
import AddressStep from '../common/AddressStep';
import { useConversion } from '../../common/apiHooks';
import { usePageTitle } from '../../common/usePageTitle';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { hasAddress } from '../../common/user/address';
import { hasContactDetailsAmlCheck } from '../../aml';
import { State } from '../../../types';
import {
  InsuranceTransferStepPath,
  insuranceTransferSteps,
  skipsAStepToDo,
} from './insuranceTransferSteps';
import { InsuranceTransferSelection } from './InsuranceTransferSelection';
import { InsuranceTransferRequest } from './InsuranceTransferRequest';
import { LoadFailed } from './LoadFailed';
import { flowPath } from './insuranceTransferPaths';

const addressedStepOf = (pathname: string) => pathname.split('/').pop();

const useStepPathsFixedOnceLoaded = () => {
  const history = useHistory();
  const { pathname, search } = useLocation();
  const user = useSelector((state: State) => state.login.user);
  const missingAmlChecks = useSelector((state: State) => state.aml.missingAmlChecks);
  const missingAmlChecksFailed = useSelector(
    ({ aml }: State) => !aml.missingAmlChecks && !!aml.error,
  );
  const {
    data: conversion,
    isFetching: refreshingConversion,
    isError: conversionFailed,
  } = useConversion();
  const [stepPaths, setStepPaths] = useState<InsuranceTransferStepPath[] | null>(null);

  useEffect(() => {
    if (stepPaths || !user || !missingAmlChecks || !conversion || refreshingConversion) {
      return;
    }
    const paths = insuranceTransferSteps({
      contactDetailsMissing: !hasAddress(user) || !hasContactDetailsAmlCheck(missingAmlChecks),
      selectionComplete: conversion.thirdPillar.selectionComplete,
    });
    setStepPaths(paths);
    if (skipsAStepToDo(paths, addressedStepOf(pathname))) {
      history.replace({ pathname: `${flowPath}/${paths[0]}`, search });
    }
  }, [
    stepPaths,
    user,
    missingAmlChecks,
    conversion,
    refreshingConversion,
    history,
    pathname,
    search,
  ]);

  return { stepPaths, loadFailed: missingAmlChecksFailed || (!conversion && conversionFailed) };
};

const toFlowStep = (
  path: InsuranceTransferStepPath,
  nextPath: string,
  selectionCarriesAddress: boolean,
): FlowStep => {
  switch (path) {
    case 'contact-details':
      return {
        path,
        Component: () => (
          <AddressStep
            nextPath={nextPath}
            updateOnlyEmailAndPhone={selectionCarriesAddress}
            pillar={3}
          />
        ),
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
        Component: () => <InsuranceTransferRequest />,
        title: <FormattedMessage id="insuranceTransfer.steps.request.title" />,
      };
    default:
      throw new Error(`Unknown insurance transfer step: path=${path}`);
  }
};

export const InsuranceTransferFlow = () => {
  usePageTitle('pageTitle.thirdPillarInsurance');
  const { pathname, search } = useLocation();
  const { stepPaths, loadFailed } = useStepPathsFixedOnceLoaded();

  if (!stepPaths) {
    return <div className="mt-4">{loadFailed ? <LoadFailed /> : <Shimmer height={400} />}</div>;
  }

  const addressedStep = addressedStepOf(pathname);
  if (!stepPaths.some((path) => path === addressedStep)) {
    return <Redirect to={{ pathname: `${flowPath}/${stepPaths[0]}`, search }} />;
  }

  const selectionCarriesAddress = stepPaths.includes('selection');
  const steps = stepPaths.map((path, index) =>
    toFlowStep(
      path,
      `${flowPath}/${stepPaths[index + 1] ?? path}${search}`,
      selectionCarriesAddress,
    ),
  );

  return <ConnectedFlow flowPath={flowPath} steps={steps} />;
};
