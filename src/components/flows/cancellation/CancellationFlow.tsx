import React from 'react';
import { FormattedMessage } from 'react-intl';
import Flow from '../common/Flow'; // eslint-disable-line import/no-named-as-default
import { CancellationSuccess } from './CancellationSuccess';
import { ConfirmCancellation } from './ConfirmCancellation';
import { flowPath, successPath } from './paths';

const steps = [
  {
    path: 'confirm',
    Component: () => <ConfirmCancellation />,
    title: <FormattedMessage id="cancellation.flow.confirm.title" />,
  },
  {
    path: successPath,
    Component: () => <CancellationSuccess />,
  },
];

export const CancellationFlow: React.FunctionComponent = () => (
  <Flow flowPath={flowPath} steps={steps} />
);

export { flowPath, successPath };
