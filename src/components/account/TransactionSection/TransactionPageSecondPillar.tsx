import React from 'react';
import { FormattedMessage } from 'react-intl';
import { TransactionSection } from './TransactionSection';

export const TransactionPageSecondPillar: React.FunctionComponent = () => {
  return (
    <>
      <TransactionSection pillar={2}>
        <FormattedMessage id="transactions.title.2nd" />
      </TransactionSection>
    </>
  );
};
