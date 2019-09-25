import React from 'react';
import { Message } from 'retranslate';

import ThirdPillarSetup from './ThirdPillarSetup';
import ThirdPillarSelectSources from './ThirdPillarSelectSources';
import ThirdPillarAddress from './ThirdPillarAddress';
import ConfirmThirdPillarMandate from './ConfirmThirdPillarMandate';
import ThirdPillarPayment from './ThirdPillarPayment';
import Flow from '../common/Flow'; // eslint-disable-line import/no-named-as-default
import ThirdPillarSuccess from './ThirdPillarSuccess';

const flowPath = '/3rd-pillar-flow';
const steps = [
  {
    path: 'setup',
    Component: () => <ThirdPillarSetup nextPath={`${flowPath}/select-sources`} />,
    title: <Message>thirdPillarFlow.steps.setup.title</Message>,
  },
  {
    path: 'select-sources',
    Component: () => <ThirdPillarSelectSources nextPath={`${flowPath}/address`} />,
    title: <Message>thirdPillarFlow.steps.selectSources.title</Message>,
  },
  {
    path: 'address',
    Component: () => <ThirdPillarAddress nextPath={`${flowPath}/confirm-mandate`} />,
    title: <Message>thirdPillarFlow.steps.address.title</Message>,
  },
  {
    path: 'confirm-mandate',
    Component: () => (
      <ConfirmThirdPillarMandate
        previousPath={`${flowPath}/setup`}
        nextPath={`${flowPath}/payment`}
      />
    ),
    title: <Message>thirdPillarFlow.steps.confirmMandate.title</Message>,
  },
  {
    path: 'payment',
    Component: () => (
      <ThirdPillarPayment
        previousPath={`${flowPath}/confirm-mandate`}
        nextPath={`${flowPath}/success`}
      />
    ),
    title: <Message>thirdPillarFlow.steps.payment.title</Message>,
  },
  {
    path: 'success',
    Component: ThirdPillarSuccess,
  },
];

const ThirdPillarFlow = () => <Flow name="THIRD_PILLAR" flowPath={flowPath} steps={steps} />;

export default ThirdPillarFlow;
