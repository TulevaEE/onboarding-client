import React from 'react';

import { FormattedMessage } from 'react-intl';
import ThirdPillarSetup from './ThirdPillarSetup';
import ThirdPillarSelectSources from './ThirdPillarSelectSources';
import AddressStep from '../common/AddressStep';
import ConfirmThirdPillarMandate from './ConfirmThirdPillarMandate';
import Flow from '../common/Flow'; // eslint-disable-line import/no-named-as-default
import BackToPartner from './BackToPartner/BackToPartner';

const flowPath = '/partner/3rd-pillar-flow';
const steps = [
  {
    path: 'setup',
    Component: () => <ThirdPillarSetup nextPath={`${flowPath}/select-sources`} />,
    title: <FormattedMessage id="thirdPillarFlow.steps.setup.title" />,
  },
  {
    path: 'select-sources',
    Component: () => <ThirdPillarSelectSources nextPath={`${flowPath}/address`} />,
    title: <FormattedMessage id="thirdPillarFlow.steps.selectSources.title" />,
  },
  {
    path: 'address',
    Component: () => (
      <AddressStep nextPath={`${flowPath}/confirm-mandate`} updateOnlyEmailAndPhone pillar={3} />
    ),
    title: <FormattedMessage id="thirdPillarFlow.steps.address.title" />,
  },
  {
    path: 'confirm-mandate',
    Component: () => (
      <ConfirmThirdPillarMandate
        previousPath={`${flowPath}/setup`}
        nextPath={`${flowPath}/success`}
      />
    ),
    title: <FormattedMessage id="thirdPillarFlow.steps.confirmMandate.title" />,
  },
  {
    path: 'success',
    Component: () => <BackToPartner />,
  },
];

export default () => <Flow name="THIRD_PILLAR" flowPath={flowPath} steps={steps} />;
