import React from 'react';
import { FormattedMessage } from 'react-intl';
import { TransactionSection } from './TransactionSection';
import { usePageTitle } from '../../common/usePageTitle';

export const SavingsTransactionPage: React.FunctionComponent = () => {
  usePageTitle('pageTitle.savingsFundTransactions');

  return (
    <TransactionSection pillar={null}>
      <FormattedMessage id="transactions.title.savingsFund" />
    </TransactionSection>
  );
};
