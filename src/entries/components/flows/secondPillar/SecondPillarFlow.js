import React from 'react';
import { Message } from 'retranslate';

import SelectSources from './selectSources';
import TransferFutureCapital from './transferFutureCapital';
import ConfirmMandate from './confirmMandate';
import Success from './success';
import Flow from '../common/Flow'; // eslint-disable-line import/no-named-as-default
import AddressStep from '../common/AddressStep';

const flowPath = '/2nd-pillar-flow';
const introMessage = <Message>steps.intro</Message>;
const steps = [
  {
    path: 'select-sources',
    Component: () => <SelectSources nextPath={`${flowPath}/transfer-future-capital`} />,
    title: <Message>steps.select-sources</Message>,
  },
  {
    path: 'transfer-future-capital',
    Component: () => (
      <TransferFutureCapital
        previousPath={`${flowPath}/select-sources`}
        nextPath={`${flowPath}/address`}
      />
    ),
    title: <Message>steps.transfer-future-capital</Message>,
  },
  {
    path: 'address',
    Component: () => (
      <AddressStep nextPath={`${flowPath}/confirm-mandate`} updateOnlyEmailAndPhone />
    ),
    title: <Message>steps.address</Message>,
  },
  {
    path: 'confirm-mandate',
    Component: () => (
      <ConfirmMandate previousPath={`${flowPath}/address`} nextPath={`${flowPath}/success`} />
    ),
    title: <Message>steps.confirm-mandate</Message>,
  },
  {
    path: 'success',
    Component: () => <Success previousPath={`${flowPath}/confirm-mandate`} />,
  },
];

const SecondPillarFlow = () => (
  <Flow name="SECOND_PILLAR" flowPath={flowPath} introMessage={introMessage} steps={steps} />
);

export default SecondPillarFlow;
