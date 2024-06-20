import React from 'react';
import { FormattedMessage } from 'react-intl';
import { TransactionSection } from './TransactionSection';

export const TransactionPageThirdPillar: React.FunctionComponent = () => (
  <>
    <TransactionSection pillar={3}>
      <FormattedMessage id="transactions.title.3rd" />
    </TransactionSection>
  </>
);
