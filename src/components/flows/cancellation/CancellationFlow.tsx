import React from 'react';
import { FormattedMessage } from 'react-intl';
import Flow from '../common/Flow'; // eslint-disable-line import/no-named-as-default
import { CancellationSuccess } from './CancellationSuccess';
import { ConfirmCancellation } from './ConfirmCancellation';

export const flowPath = '/applications/:applicationId/cancellation';
const steps = [
  {
    path: 'confirm',
    Component: ConfirmCancellation,
    title: <FormattedMessage id="cancellation.flow.confirm.title" />,
  },
  {
    path: 'success',
    Component: CancellationSuccess,
  },
];

export const CancellationFlow: React.FunctionComponent = () => (
  <Flow name="CANCELLATION" flowPath={flowPath} steps={steps} />
);
