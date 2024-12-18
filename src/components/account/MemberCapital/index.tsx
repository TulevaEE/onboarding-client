import React, { FC } from 'react';
import { FormattedMessage } from 'react-intl';

import sumBy from 'lodash/sumBy';
import Table from '../../common/table';
import { Euro } from '../../common/Euro';
import { CapitalRow } from '../../common/apiModels';

interface Props {
  rows: CapitalRow[];
}
export const MemberCapital: FC<Props> = ({ rows = [] }) => {
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
      title: <FormattedMessage id="memberCapital.columns.value.title" />,
      dataIndex: 'contributions',
      footer: <Euro amount={valueSum} />,
    },
  ];

  const dataSource = rows.map(({ type, contributions }) => ({
    type: <FormattedMessage id={`memberCapital.source.${type}`} />,
    contributions: <Euro amount={contributions} />,
    key: type.toString(),
  }));

  dataSource.push({
    type: <FormattedMessage id="memberCapital.source.profit" />,
    contributions: <Euro amount={profitSum} />,
    key: 'profit',
  });

  return <Table columns={columns} dataSource={dataSource} />;
};
