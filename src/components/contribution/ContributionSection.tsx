import React from 'react';

import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import moment from 'moment/moment';
import sumBy from 'lodash/sumBy';
import { useContributions } from '../common/apiHooks';
import { Shimmer } from '../common/shimmer/Shimmer';
import Euro from '../common/Euro';
import Table from '../common/table';

export const ContributionSection: React.FunctionComponent<{
  limit?: number;
  pillar?: number;
  children?: React.ReactNode;
}> = ({ limit, pillar, children }) => {
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

  let pillarContributions = contributions;

  if (pillar) {
    pillarContributions = contributions.filter((contribution) => contribution.pillar === pillar);
  }

  if (!pillarContributions.length) {
    return <></>;
  }

  const amountSum = sumBy(pillarContributions, (contribution) => contribution.amount);

  const columns = [
    {
      title: <FormattedMessage id="contributions.columns.date.title" />,
      dataIndex: 'date',
      align: 'right',
      ...(!limit && { footer: <FormattedMessage id="contributions.columns.date.footer" /> }),
    },
    {
      title: <FormattedMessage id="contributions.columns.sender.title" />,
      dataIndex: 'sender',
      width100: true,
      align: 'left',
    },
    {
      title: <FormattedMessage id="contributions.columns.amount.title" />,
      dataIndex: 'amount',
      ...(!limit && { footer: <Euro amount={amountSum} /> }),
    },
  ];

  let dataSource = pillarContributions
    .sort((contribution1, contribution2) => contribution2.time.localeCompare(contribution1.time))
    .flatMap((contribution, index) => {
      const previousContribution = pillarContributions[index - 1];
      const previousYear = new Date(previousContribution?.time || '9999-12-31').getUTCFullYear();
      const currentYear = new Date(contribution.time).getUTCFullYear();
      const date = formatDate(contribution.time);
      return [
        ...(!limit && previousYear > currentYear
          ? [
              {
                date: <strong>{currentYear}</strong>,
                key: currentYear.toString(),
              },
            ]
          : []),
        {
          date: <span className="text-nowrap">{date}</span>,
          sender: <span>{contribution.sender}</span>,
          amount: <Euro amount={contribution.amount} />,
          key: contribution.time,
        },
      ];
    });

  if (limit) {
    dataSource = dataSource.slice(0, limit);
  }

  return (
    <section className="mt-5">
      <div className="d-flex justify-content-between">
        <h2 className="mb-4 lead">{children || <FormattedMessage id="contributions.title" />}</h2>
        <div>
          {limit ? (
            <Link to="/contributions">
              <FormattedMessage id="contributions.seeAll" />
            </Link>
          ) : (
            <Link to="/account">
              <FormattedMessage id="contributions.backToAccountPage" />
            </Link>
          )}
        </div>
      </div>
      <Table columns={columns} dataSource={dataSource} />
    </section>
  );
};

function formatDate(date: string): string {
  const format = moment.locale() === 'et' ? 'D. MMMM' : 'MMMM D';
  return moment(date).format(format);
}
