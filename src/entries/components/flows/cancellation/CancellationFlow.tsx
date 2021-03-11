import React from 'react';
import { Message } from 'retranslate';
import Flow from '../common/Flow'; // eslint-disable-line import/no-named-as-default
import { CancellationSuccess } from './CancellationSuccess';
import { ConfirmCancellation } from './ConfirmCancellation';

export const flowPath = '/applications/:applicationId/cancellation';
const steps = [
  {
    path: 'confirm',
    Component: ConfirmCancellation,
    title: <Message>cancellation.flow.confirm.title</Message>,
  },
  {
    path: 'success',
    Component: CancellationSuccess,
  },
];

export const CancellationFlow = () => (
  <Flow name="CANCELLATION" flowPath={flowPath} steps={steps} />
);
