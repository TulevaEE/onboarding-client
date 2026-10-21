import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Transaction, TransactionType } from '../../common/apiModels';

const PAYMENTS_INTO_THE_FUND: TransactionType[] = [
  'CONTRIBUTION_CASH',
  'CONTRIBUTION_CASH_WORKPLACE',
];

export const payerOf = (transaction: Transaction): React.ReactNode => {
  if (!PAYMENTS_INTO_THE_FUND.includes(transaction.type)) {
    return null;
  }
  if (transaction.paidFromOwnAccount) {
    return <FormattedMessage id="transactions.payer.ownAccount" />;
  }
  return transaction.remitterName || null;
};
