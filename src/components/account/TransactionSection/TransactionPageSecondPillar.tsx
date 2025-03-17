import React from 'react';
import { FormattedMessage } from 'react-intl';
import { TransactionSection } from './TransactionSection';
import { usePageTitle } from '../../common/usePageTitle';

export const TransactionPageSecondPillar: React.FunctionComponent = () => {
  usePageTitle('pageTitle.secondPillarTransactions');

  return (
    <TransactionSection pillar={2}>
      <FormattedMessage id="transactions.title.2nd" />
    </TransactionSection>
  );
};
