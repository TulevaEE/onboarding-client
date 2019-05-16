import React from 'react';
import { Message } from 'retranslate';

import ThirdPillarSetup from './ThirdPillarSetup';
import Flow from '../common/Flow'; // eslint-disable-line import/no-named-as-default

const flowPath = '/3rd-pillar-flow';
const steps = [
  {
    path: 'setup',
    Component: () => <ThirdPillarSetup nextPath={`${flowPath}/confirm-mandate`} />,
    title: <Message>thirdPillarFlow.steps.setup.title</Message>,
  },
];

const ThirdPillarFlow = () => <Flow name="THIRD_PILLAR" flowPath={flowPath} steps={steps} />;

export default ThirdPillarFlow;
