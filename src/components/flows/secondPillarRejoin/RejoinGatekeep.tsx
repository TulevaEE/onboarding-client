import { PropsWithChildren } from 'react';
import { useSelector } from 'react-redux';
import { Redirect, useLocation } from 'react-router-dom';
import { Loader } from '../../common';
import { usePendingApplications, useRejoinPermission } from '../../common/apiHooks';
import { isRejoinApplication } from '../../account/ApplicationSection/ApplicationFunctions';
import { State } from '../../../types';
import { flowPath } from './secondPillarRejoinPaths';

export const RejoinGatekeep = ({ children }: PropsWithChildren<unknown>) => {
  const contributions = useSelector((state: State) => state.login.user?.secondPillarContributions);
  const hasStoppedContributing =
    contributions?.contributing === false && contributions.restartDate === null;

  if (hasStoppedContributing) {
    return <SendToRejoinWhenPermitted>{children}</SendToRejoinWhenPermitted>;
  }
  return <>{children}</>;
};

const SendToRejoinWhenPermitted = ({ children }: PropsWithChildren<unknown>) => {
  const { search } = useLocation();
  const { data: permission, isInitialLoading: askingPensionikeskus } = useRejoinPermission();
  const { data: applications, isInitialLoading: loadingApplications } = usePendingApplications();

  if (askingPensionikeskus || loadingApplications) {
    return <Loader className="align-middle my-4" />;
  }

  const hasAppliedToRejoin = applications?.some(isRejoinApplication) ?? false;
  if (permission?.permitted === true && !hasAppliedToRejoin) {
    return <Redirect to={{ pathname: flowPath, search }} />;
  }
  return <>{children}</>;
};
