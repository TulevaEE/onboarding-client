import React from 'react';
import { Message } from 'retranslate';

import SelectSources from './selectSources';
import TransferFutureCapital from './transferFutureCapital';
import ConfirmMandate from './confirmMandate';
import Success from './success';
import Flow from '../common/Flow'; // eslint-disable-line import/no-named-as-default

const introMessage = <Message>steps.intro</Message>;
const steps = [
  {
    path: 'select-sources',
    Component: SelectSources,
    title: <Message>steps.select-sources</Message>,
  },
  {
    path: 'transfer-future-capital',
    Component: TransferFutureCapital,
    title: <Message>steps.transfer-future-capital</Message>,
  },
  {
    path: 'confirm-mandate',
    Component: ConfirmMandate,
    title: <Message>steps.confirm-mandate</Message>,
  },
  {
    path: 'success',
    Component: Success,
  },
];

const SecondPillarFlow = () => (
  <Flow
    name="SECOND_PILLAR"
    flowPath="/2nd-pillar-flow"
    introMessage={introMessage}
    steps={steps}
  />
);

export default SecondPillarFlow;
