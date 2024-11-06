import { FormattedMessage } from 'react-intl';
import React from 'react';
import { useFunds, useMe, useTransactions } from '../../common/apiHooks';
import Euro from '../../common/Euro';
import { Fund, Transaction } from '../../common/apiModels';

export const SecondPillarPaymentRateTaxWin = () => {
  const { data: transactions } = useTransactions();
  const { data: funds } = useFunds();
  const { data: user } = useMe();
  const currentPaymentRate = user?.secondPillarPaymentRates.current || 2;
  const estimatedYearlyTaxWin = estimateYearlyTaxWin(transactions, funds, currentPaymentRate);
  const message = (
    <FormattedMessage
      id="account.status.choice.pillar.second.tax.benefit.deadline"
      values={{
        estimatedWin: <Euro amount={estimatedYearlyTaxWin} fractionDigits={0} />,
        b: (chunks: string) => <b>{chunks}</b>,
      }}
    />
  );
  return estimatedYearlyTaxWin >= 1 ? (
    message
  ) : (
    <FormattedMessage
      id="account.status.choice.pillar.second.paymentRate.comment"
      values={{
        b: (chunks: string) => <b>{chunks}</b>,
      }}
    />
  );
};

const estimateYearlyTaxWin = (
  transactions: Transaction[] | undefined,
  funds: Fund[] | undefined,
  currentPaymentRate: number,
) => {
  const averageSecondPillarPayment =
    transactions
      ?.map((transaction) => {
        const fund = funds?.find((fnd) => fnd.isin === transaction.isin);
        return {
          ...transaction,
          pillar: fund?.pillar,
        };
      })
      .filter((transaction) => transaction.pillar === 2)
      .slice(0, 6)
      .reduce(
        (acc, transaction, _, secondPillarTransactions) =>
          acc + transaction.amount / secondPillarTransactions.length,
        0,
      ) || 0;

  const governmentPaymentRate = 4;

  const estimatedWage =
    averageSecondPillarPayment / ((currentPaymentRate + governmentPaymentRate) / 100);

  const maxPercentage = 0.06;
  const incomeTax = 0.22;
  const months = 12;

  return estimatedWage * maxPercentage * incomeTax * months;
};
