import React, { FC } from 'react';
import { FormattedMessage } from 'react-intl';

import sumBy from 'lodash/sumBy';
import Table from '../../common/table';
import Euro from '../../common/Euro';
import { CapitalRow } from '../../common/apiModels';

interface Props {
  rows: CapitalRow[];
}
export const MemberCapital: FC<Props> = ({ rows = [] }) => {
  const contributionsSum = sumBy(rows, (row) => row.contributions);
  const profitSum = sumBy(rows, (row) => row.profit);
  const valueSum = sumBy(rows, (row) => row.value);

  const columns = [
    {
      title: <FormattedMessage id="memberCapital.columns.source.title" />,
      dataIndex: 'type',
      footer: <FormattedMessage id="memberCapital.columns.source.total" />,
      width100: true,
    },
    {
      title: <FormattedMessage id="memberCapital.columns.contributions.title" />,
      dataIndex: 'contributions',
      footer: <Euro amount={contributionsSum} />,
    },
    {
      title: <FormattedMessage id="memberCapital.columns.profit.title" />,
      dataIndex: 'profit',
      footer: <Euro amount={profitSum} />,
    },
    {
      title: <FormattedMessage id="memberCapital.columns.value.title" />,
      dataIndex: 'value',
      footer: <Euro amount={valueSum} />,
    },
  ];

  const dataSource = rows.map(({ type, contributions, profit, value }) => ({
    type: <FormattedMessage id={`memberCapital.source.${type}`} />,
    contributions: <Euro amount={contributions} />,
    profit: <Euro amount={profit} />,
    value: <Euro amount={value} />,
    key: type,
  }));

  return <Table columns={columns} dataSource={dataSource} />;
};

export default MemberCapital;
