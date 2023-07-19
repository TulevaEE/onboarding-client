import React from 'react';

import { FormattedMessage } from 'react-intl';
import sumBy from 'lodash/sumBy';
import { useContributions } from '../common/apiHooks';
import { Shimmer } from '../common/shimmer/Shimmer';
import Euro from '../common/Euro';
import Table from '../common/table';
import { Contribution } from '../common/apiModels';

export const ContributionSection: React.FunctionComponent<{
  children?: React.ReactNode;
}> = ({ children }) => {
  const { data: contributions } = useContributions();

  if (!contributions) {
    return (
      <section className="mt-5">
        <Shimmer height={26} />
      </section>
    );
  }

  if (!contributions.length) {
    return <></>;
  }

  const amountSum = sumBy(contributions, (contribution) => contribution.amount);

  const sumAmountsBySender = (
    result: {
      [sender: string]: Contribution;
    },
    { time, sender, amount, currency, pillar }: Contribution,
  ) => ({
    ...result,
    [sender.toLowerCase()]: {
      time,
      sender,
      amount: (result[sender.toLowerCase()] || { amount: 0 }).amount + amount,
      currency,
      pillar,
    },
  });
  const thirdPillarAggregate = contributions
    .filter((contribution) => contribution.pillar === 3)
    .sort((contribution1, contribution2) => contribution2.time.localeCompare(contribution1.time))
    .reduce(sumAmountsBySender, {});

  const secondPillarAggregate = contributions
    .filter((contribution) => contribution.pillar === 2)
    .sort((contribution1, contribution2) => contribution2.time.localeCompare(contribution1.time))
    .reduce(sumAmountsBySender, {});

  const columns = [
    {
      title: <FormattedMessage id="contributions.columns.sender.title" />,
      dataIndex: 'sender',
      width100: true,
      align: 'left',
    },
    {
      title: <FormattedMessage id="contributions.columns.amount.title" />,
      dataIndex: 'amount',
      footer: <Euro amount={amountSum} />,
    },
  ];

  const pillarContributions = [
    ...Object.values(thirdPillarAggregate),
    ...Object.values(secondPillarAggregate),
  ];
  const dataSource = pillarContributions.flatMap((contribution, index) => {
    const previousContribution = pillarContributions[index - 1];
    return [
      ...(previousContribution?.pillar !== contribution.pillar
        ? [
            {
              sender: (
                <strong>
                  {contribution.pillar === 2 ? (
                    <FormattedMessage id="accountStatement.secondPillar.heading" />
                  ) : (
                    <FormattedMessage id="accountStatement.thirdPillar.heading" />
                  )}
                </strong>
              ),
              key: contribution.pillar.toString(),
            },
          ]
        : []),
      {
        sender: contribution.sender,
        amount: <Euro amount={contribution.amount} />,
        key: contribution.time,
      },
    ];
  });

  return (
    <section className="mt-5">
      <div className="d-flex justify-content-between">
        <h2 className="mb-4 lead">{children || <FormattedMessage id="contributions.title" />}</h2>
      </div>
      <Table columns={columns} dataSource={dataSource} />
    </section>
  );
};
