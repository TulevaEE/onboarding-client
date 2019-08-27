import React from 'react';
import Types from 'prop-types';
import { Message } from 'retranslate';

import Table from '../../common/table';
import Euro from '../../common/Euro';

const MemberCapital = ({
  value: { capitalPayment, profit, membershipBonus, workCompensation, unvestedWorkCompensation },
}) => {
  const columns = [
    {
      title: <Message>memberCapital.columns.source.title</Message>,
      dataIndex: 'source',
      footer: <Message>memberCapital.columns.source.total</Message>,
    },
    {
      title: <Message>memberCapital.columns.value.title</Message>,
      dataIndex: 'value',
      footer: (
        <Euro
          amount={
            capitalPayment + membershipBonus + profit + unvestedWorkCompensation + workCompensation
          }
        />
      ),
    },
  ];

  const dataSource = [
    {
      source: <Message>memberCapital.source.capitalPayment</Message>,
      value: <Euro amount={capitalPayment} />,
      key: 'payment',
    },
    {
      source: <Message>memberCapital.source.profit</Message>,
      value: <Euro amount={profit} />,
      key: 'profit',
    },
    {
      source: <Message>memberCapital.source.membershipBonus</Message>,
      value: <Euro amount={membershipBonus} />,
      key: 'bonus',
    },
  ];

  if (workCompensation) {
    dataSource.push({
      source: <Message>memberCapital.source.workCompensation</Message>,
      value: <Euro amount={workCompensation} />,
      key: 'work',
    });
  }

  if (unvestedWorkCompensation) {
    dataSource.push({
      source: <Message>memberCapital.source.unvestedWorkCompensation</Message>,
      value: <Euro amount={unvestedWorkCompensation} />,
      key: 'unvestedWork',
    });
  }

  return <Table columns={columns} dataSource={dataSource} />;
};

MemberCapital.propTypes = {
  value: Types.shape({
    capitalPayment: Types.number,
    profit: Types.number,
    membershipBonus: Types.number,
    workCompensation: Types.number,
    unvestedWorkCompensation: Types.number,
  }),
};

MemberCapital.defaultProps = {
  value: {
    capitalPayment: 0,
    profit: 0,
    membershipBonus: 0,
    workCompensation: 0,
    unvestedWorkCompensation: 0,
  },
};

export default MemberCapital;
