import React from 'react';
import Types from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';

import Table from '../../common/table';
import Euro from '../../common/Euro';

const MemberCapital = ({
  value: {
    capitalPayment,
    profit,
    membershipBonus,
    workCompensation,
    unvestedWorkCompensation,
    total,
  },
}) => {
  const { formatMessage } = useIntl();

  const columns = [
    {
      title: <FormattedMessage id="memberCapital.columns.source.title" />,
      dataIndex: 'source',
      footer: <FormattedMessage id="memberCapital.columns.source.total" />,
      width100: true,
    },
    {
      title: <FormattedMessage id="memberCapital.columns.value.title" />,
      dataIndex: 'value',
      footer: <Euro amount={total} />,
    },
  ];

  const dataSource = [
    ...(capitalPayment
      ? [
          {
            source: <FormattedMessage id="memberCapital.source.capitalPayment" />,
            value: <Euro amount={capitalPayment} />,
            key: 'payment',
          },
        ]
      : []),
    ...(profit
      ? [
          {
            source: <FormattedMessage id="memberCapital.source.profit" />,
            value: <Euro amount={profit} />,
            key: 'profit',
          },
        ]
      : []),
    {
      source: (
        <FormattedMessage
          id="memberCapital.source.membershipBonus"
          values={{
            a: (chunks) => (
              <a
                target="_blank"
                rel="noreferrer"
                href={formatMessage({ id: 'memberCapital.source.membershipBonus.link' })}
              >
                {chunks}
              </a>
            ),
          }}
        />
      ),
      value: <Euro amount={membershipBonus} />,
      key: 'bonus',
    },
    ...(workCompensation
      ? [
          {
            source: <FormattedMessage id="memberCapital.source.workCompensation" />,
            value: <Euro amount={workCompensation} />,
            key: 'work',
          },
        ]
      : []),
    ...(unvestedWorkCompensation
      ? [
          {
            source: <FormattedMessage id="memberCapital.source.unvestedWorkCompensation" />,
            value: <Euro amount={unvestedWorkCompensation} />,
            key: 'unvestedWork',
          },
        ]
      : []),
  ];

  return <Table columns={columns} dataSource={dataSource} />;
};

MemberCapital.propTypes = {
  value: Types.shape({
    capitalPayment: Types.number,
    profit: Types.number,
    membershipBonus: Types.number,
    workCompensation: Types.number,
    unvestedWorkCompensation: Types.number,
    total: Types.number,
    currency: Types.string,
  }),
};

MemberCapital.defaultProps = {
  value: {
    capitalPayment: 0,
    profit: 0,
    membershipBonus: 0,
    workCompensation: 0,
    unvestedWorkCompensation: 0,
    total: 0,
    currency: 'EUR',
  },
};

export default MemberCapital;
