import React from 'react';
import { FormattedMessage } from 'react-intl';
import { TransactionSection } from './TransactionSection';

export const TransactionPage: React.FunctionComponent = () => {
  return (
    <>
      <TransactionSection pillar={2}>
        <FormattedMessage id="transactions.title.2nd" />
      </TransactionSection>
      <TransactionSection pillar={3}>
        <FormattedMessage id="transactions.title.3rd" />
      </TransactionSection>
    </>
  );
};
