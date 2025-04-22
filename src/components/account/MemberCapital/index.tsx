import React, { FC } from 'react';
import { FormattedMessage } from 'react-intl';

import sumBy from 'lodash/sumBy';
import Table from '../../common/table';
import { Euro } from '../../common/Euro';
import { CapitalRow } from '../../common/apiModels';
import { TableColumn } from '../../common/table/Table';
import { InfoTooltip } from '../../common';

interface Props {
  rows: CapitalRow[];
}
export const MemberCapital: FC<Props> = ({ rows = [] }) => {
  const contributionsSum = sumBy(rows, (row) => row.contributions);
  const profitSum = sumBy(rows, (row) => row.profit);
  const valueSum = sumBy(rows, (row) => row.value);

  const shouldRenderFooter = new Set(rows.map((row) => row.type)).size > 1;

  const columns: TableColumn[] = [
    {
      title: <FormattedMessage id="memberCapital.columns.source.title" />,
      dataIndex: 'type',
      footer: shouldRenderFooter && (
        <span data-testid="member-capital-total">
          <FormattedMessage id="memberCapital.columns.source.total" />
        </span>
      ),
      width100: true,
    },
    {
      title: <FormattedMessage id="memberCapital.columns.contributions.title" />,
      dataIndex: 'contributions',
      footer: shouldRenderFooter && <Euro amount={contributionsSum} />,
      hideOnMobile: true,
    },
    {
      title: <FormattedMessage id="memberCapital.columns.profit.title" />,
      dataIndex: 'profit',
      footer: shouldRenderFooter && <Euro amount={profitSum} />,
      hideOnMobile: true,
    },
    {
      title: <FormattedMessage id="memberCapital.columns.value.title" />,
      dataIndex: 'value',
      footer: shouldRenderFooter && <Euro amount={valueSum} />,
    },
  ];

  const dataSource = rows.map(({ type, contributions, profit, value }) => ({
    type: (
      <>
        <FormattedMessage id={`memberCapital.source.${type}`} />
        {type === 'MEMBERSHIP_BONUS' && (
          <InfoTooltip name="member-capital-tooltip">
            <FormattedMessage id="membercapital.source.MEMBERSHIP_BONUS.tooltip" />
          </InfoTooltip>
        )}
      </>
    ),
    contributions: <Euro amount={contributions} />,
    profit: <Euro amount={profit} />,
    value: <Euro amount={value} />,
    key: type.toString(),
  }));

  return <Table columns={columns} dataSource={dataSource} />;
};
