import React from 'react';

import { FormattedMessage } from 'react-intl';
import sumBy from 'lodash/sumBy';
import { Link } from 'react-router-dom';
import { useContributions } from '../common/apiHooks';
import { Shimmer } from '../common/shimmer/Shimmer';
import Euro from '../common/Euro';
import Table from '../common/table';
import { Contribution } from '../common/apiModels';

export const ContributionSection: React.FunctionComponent<{
  pillar?: number;
  children?: React.ReactNode;
}> = ({ pillar, children }) => {
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
  const sumAmountsBySender = (
    result: {
      [sender: string]: Contribution;
    },
    // eslint-disable-next-line @typescript-eslint/no-shadow
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
  const aggregatePillarContributions = contributions
    .filter((contribution) => contribution.pillar === pillar)
    .sort((contribution1, contribution2) => contribution2.time.localeCompare(contribution1.time))
    .reduce(sumAmountsBySender, {});

  const pillarContributions = Object.values(aggregatePillarContributions);

  const amountSum = sumBy(pillarContributions, (contribution) => contribution.amount);

  function footerMessage() {
    if (pillar === 2) {
      return (
        <small className="text-muted">
          <FormattedMessage
            id="contributions.notice.2nd"
            values={{
              a: (chunks: string) => (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="//www.pensionikeskus.ee/pensionireform-2021/kusimused-ja-vastused-2-samba-maksete-kompenseerimise-kohta/"
                >
                  {chunks}
                </a>
              ),
            }}
          />
        </small>
      );
    }
    if (pillar === 3) {
      return (
        <small className="text-muted">
          <FormattedMessage id="contributions.notice.3rd" />
        </small>
      );
    }
    return '';
  }

  const columns = [
    {
      title: <FormattedMessage id="contributions.columns.sender.title" />,
      dataIndex: 'sender',
      width100: true,
      align: 'left',
      footer: footerMessage(),
    },
    {
      title: <FormattedMessage id="contributions.columns.amount.title" />,
      dataIndex: 'amount',
      footer: <Euro amount={amountSum} />,
    },
  ];

  const dataSource = pillarContributions.map((contribution) => ({
    sender: contribution.sender,
    amount: <Euro amount={contribution.amount} />,
    key: contribution.time,
  }));

  return (
    <section className="mt-5">
      <div className="d-flex flex-md-row flex-column align-items-md-end justify-content-between">
        <h2 className="mb-4 lead">{children || <FormattedMessage id="contributions.title" />}</h2>
        <div className="ml-md-2 text-nowrap mb-4">
          {pillar === 2 && (
            <Link className="text-nowrap" to="/3rd-pillar-contributions">
              <FormattedMessage id="contributions.seeAll.3" />
            </Link>
          )}
          {pillar === 3 && (
            <Link className="text-nowrap" to="/2nd-pillar-contributions">
              <FormattedMessage id="contributions.seeAll.2" />
            </Link>
          )}{' '}
          <span className="mx-2">·</span>{' '}
          <Link to="/account">
            <FormattedMessage id="contributions.backToAccountPage" />
          </Link>
        </div>
      </div>
      <Table columns={columns} dataSource={dataSource} />
    </section>
  );
};
