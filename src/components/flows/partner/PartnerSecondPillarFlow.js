import React from 'react';

import { FormattedMessage } from 'react-intl';
import { usePageTitle } from '../../common/usePageTitle';
import SelectSources from '../secondPillar/selectSources';
import ConfirmMandate from '../secondPillar/confirmMandate';
import Success from '../secondPillar/success';
import Flow from '../common/Flow'; // eslint-disable-line import/no-named-as-default
import AddressStep from '../common/AddressStep';

const flowPath = '/partner/2nd-pillar-flow';
const steps = [
  {
    path: 'select-sources',
    Component: () => <SelectSources nextPath={`${flowPath}/address`} />,
    title: <FormattedMessage id="steps.select-sources" />,
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

const PartnerSecondPillarFlow = () => {
  usePageTitle('pageTitle.secondPillarFlow');

  return <Flow flowPath={flowPath} steps={steps} />;
};

export default PartnerSecondPillarFlow;
