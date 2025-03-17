import React from 'react';
import { FormattedMessage } from 'react-intl';
import { TransactionSection } from './TransactionSection';
import { usePageTitle } from '../../common/usePageTitle';

export const TransactionPageThirdPillar: React.FunctionComponent = () => {
  usePageTitle('pageTitle.thirdPillarTransactions');
  return (
    <TransactionSection pillar={3}>
      <FormattedMessage id="transactions.title.3rd" />
    </TransactionSection>
  );
};
