import React from 'react';
import { Redirect, useRouteMatch } from 'react-router-dom';

import { FormattedMessage } from 'react-intl';
import { usePageTitle } from '../../common/usePageTitle';
import SelectSources from '../secondPillar/selectSources';
import ConfirmMandate from '../secondPillar/confirmMandate';
import Success from '../secondPillar/success';
import { SelectSourcesTitle } from '../secondPillar/SelectSourcesTitle';
import { useConversion } from '../../common/apiHooks';
import Loader from '../../common/loader';
import Flow from '../common/Flow'; // eslint-disable-line import/no-named-as-default
import AddressStep from '../common/AddressStep';

const flowPath = '/partner/2nd-pillar-flow';
const steps = [
  {
    path: 'select-sources',
    Component: () => <SelectSources nextPath={`${flowPath}/address`} />,
    title: <SelectSourcesTitle />,
  },
  {
    path: 'address',
    Component: () => (
      <AddressStep
        previousPath={`${flowPath}/select-sources`}
        nextPath={`${flowPath}/confirm-mandate`}
        updateOnlyEmailAndPhone
        pillar={2}
      />
    ),
    title: <FormattedMessage id="steps.address" />,
  },
  {
    path: 'confirm-mandate',
    Component: () => (
      <ConfirmMandate previousPath={`${flowPath}/address`} nextPath={`${flowPath}/success`} />
    ),
    title: <FormattedMessage id="steps.confirm-mandate" />,
  },
  {
    path: 'success',
    Component: () => <Success />,
  },
];

const isFullyAtTuleva = (conversion) =>
  conversion.selectionComplete && conversion.transfersComplete;

const PartnerSecondPillarFlow = () => {
  usePageTitle('pageTitle.secondPillarFlow');
  const { data: conversion, isLoading } = useConversion();
  const atEntry = useRouteMatch({
    path: [flowPath, `${flowPath}/select-sources`],
    exact: true,
  });

  if (atEntry && isLoading) {
    return <Loader className="align-middle" />;
  }
  if (atEntry && conversion && isFullyAtTuleva(conversion.secondPillar)) {
    return <Redirect to="/account" />;
  }
  return <Flow flowPath={flowPath} steps={steps} />;
};

export default PartnerSecondPillarFlow;
