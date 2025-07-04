import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Link } from 'react-router-dom';
import sumBy from 'lodash/sumBy';
import { useCapitalEvents } from '../../common/apiHooks';
import Table from '../../common/table';
import { Euro } from '../../common/Euro';
import { Shimmer } from '../../common/shimmer/Shimmer';
import { usePageTitle } from '../../common/usePageTitle';

export const CapitalPage: React.FunctionComponent = () => {
  usePageTitle('pageTitle.capitalTransactions');

  const { data: capitalEvents } = useCapitalEvents();

  if (!capitalEvents) {
    return (
      <section className="mt-5">
        <Shimmer height={26} />
      </section>
    );
  }

  const valueSum = sumBy(capitalEvents, (event) => event.value);

  const columns = [
    {
      title: <FormattedMessage id="capitalEvents.columns.date.title" />,
      dataIndex: 'date',
      align: 'right',
      footer: <FormattedMessage id="capitalEvents.columns.date.footer" />,
    },
    {
      title: <FormattedMessage id="capitalEvents.columns.source.title" />,
      dataIndex: 'type',
      width: 100,
      align: 'left',
    },
    {
      title: <FormattedMessage id="capitalEvents.columns.value.title" />,
      dataIndex: 'value',
      footer: <Euro amount={valueSum} />,
    },
  ];

  const dataSource = capitalEvents
    .sort((event1, event2) => event2.date.localeCompare(event1.date))
    .map(({ date, type, value }) => ({
      date: <span className="text-nowrap">{date}</span>,
      type: <FormattedMessage id={`memberCapital.source.${type}`} />,
      value: <Euro amount={value} />,
      key: `${date}.${type}.${value}`,
    }));

  return (
    <section className="mt-5">
      <div className="mt-5 mb-4 d-flex flex-wrap column-gap-3 row-gap-2 align-items-baseline justify-content-between">
        <h2 className="m-0">
          <FormattedMessage id="capitalEvents.title" />
        </h2>
        <div className="d-flex gap-3">
          <Link className="icon-link" to="/account">
            <FormattedMessage id="capitalEvents.backToAccountPage" />
          </Link>
        </div>
      </div>
      <Table columns={columns} dataSource={dataSource} />
    </section>
  );
};
