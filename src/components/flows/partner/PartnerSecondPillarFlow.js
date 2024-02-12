import React from 'react';

import { FormattedMessage } from 'react-intl';
import SelectSources from '../secondPillar/selectSources';
import TransferFutureCapital from '../secondPillar/transferFutureCapital';
import ConfirmMandate from '../secondPillar/confirmMandate';
import Success from '../secondPillar/success';
import Flow from '../common/Flow'; // eslint-disable-line import/no-named-as-default
import AddressStep from '../common/AddressStep';

const flowPath = '/partner/2nd-pillar-flow';
const introMessage = <FormattedMessage id="steps.intro" />;
const steps = [
  {
    path: 'select-sources',
    Component: () => <SelectSources nextPath={`${flowPath}/transfer-future-capital`} />,
    title: <FormattedMessage id="steps.select-sources" />,
  },
  {
    path: 'transfer-future-capital',
    Component: () => (
      <TransferFutureCapital
        previousPath={`${flowPath}/select-sources`}
        nextPath={`${flowPath}/address`}
      />
    ),
    title: <FormattedMessage id="steps.transfer-future-capital" />,
  },
  {
    path: 'address',
    Component: () => (
      <AddressStep nextPath={`${flowPath}/confirm-mandate`} updateOnlyEmailAndPhone pillar={2} />
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
    Component: () => <Success previousPath={`${flowPath}/confirm-mandate`} />,
  },
];

const PartnerSecondPillarFlow = () => (
  <Flow name="SECOND_PILLAR" flowPath={flowPath} introMessage={introMessage} steps={steps} />
);

export default PartnerSecondPillarFlow;
