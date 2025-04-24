import React, { FC } from 'react';
import { FormattedMessage } from 'react-intl';

import sumBy from 'lodash/sumBy';
import Table from '../../common/table';
import { Euro } from '../../common/Euro';
import { CapitalRow, CapitalType } from '../../common/apiModels';
import { TableColumn } from '../../common/table/Table';
import { InfoTooltip } from '../../common/infoTooltip/InfoTooltip';

interface Props {
  rows: CapitalRow[];
}
export const MemberCapitalTable: FC<Props> = ({ rows = [] }) => {
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
    },
    {
      title: <FormattedMessage id="memberCapital.columns.contributions.title" />,
      dataIndex: 'contributions',
      width: 15,
      footer: shouldRenderFooter && <Euro amount={contributionsSum} />,
    },
    {
      title: <FormattedMessage id="memberCapital.columns.profit.title" />,
      dataIndex: 'profit',
      width: 15,
      footer: shouldRenderFooter && <Euro amount={profitSum} />,
      hideOnBreakpoint: ['xs'],
    },
    {
      title: <FormattedMessage id="memberCapital.columns.value.title" />,
      dataIndex: 'value',
      width: 15,
      footer: shouldRenderFooter && <Euro amount={valueSum} />,
    },
  ];

  const capitalRowOrder: CapitalType[] = [
    'CAPITAL_PAYMENT',
    'MEMBERSHIP_BONUS',
    'WORK_COMPENSATION',
    'UNVESTED_WORK_COMPENSATION',
  ];

  const dataSource = rows
    .sort(
      ({ type: typeA }, { type: typeB }) =>
        capitalRowOrder.indexOf(typeA) - capitalRowOrder.indexOf(typeB),
    )
    .map(({ type, contributions, profit, value }) => ({
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
