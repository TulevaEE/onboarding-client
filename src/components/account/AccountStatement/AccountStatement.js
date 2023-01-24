import React from 'react';
import Types from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';

import Table from '../../common/table';
import Euro from '../../common/Euro';
import { getValueSum, getWeightedAverageFee } from './fundSelector';
import { Fees } from '../../common/Percentage/Fees';

const AccountStatement = ({ funds }) => {
  const { formatMessage } = useIntl();

  const valueSum = getValueSum(funds);
  const weightedAverageFee = getWeightedAverageFee(funds);

  const columns = [
    {
      title: <FormattedMessage id="accountStatement.columns.fund.title" />,
      dataIndex: 'fund',
      footer: <FormattedMessage id="accountStatement.columns.fund.footer" />,
    },
    {
      title: <FormattedMessage id="accountStatement.columns.fees.title" />,
      dataIndex: 'fees',
      footer: <Fees value={weightedAverageFee} />,
      hideOnMobile: true,
    },
    {
      title: <FormattedMessage id="accountStatement.columns.value.title" />,
      dataIndex: 'value',
      footer: <Euro amount={valueSum} />,
    },
  ];

  const dataSource = funds.map((fund) => {
    const isMuted = !fund.activeFund && fund.price + fund.unavailablePrice === 0;
    const className = isMuted ? 'text-muted' : undefined;
    const prefix = isMuted
      ? formatMessage({ id: 'accountStatement.columns.fund.muted.prefix' })
      : '';
    const suffix = fund.activeFund ? '*' : '';
    return {
      fund: <span className={className}>{`${prefix}${fund.name}${suffix}`}</span>,
      fees: <Fees value={fund.ongoingChargesFigure} />,
      value: isMuted ? (
        <></>
      ) : (
        <Euro className={className} amount={fund.price + fund.unavailablePrice} />
      ),
      key: fund.isin,
    };
  });

  const showActiveFundNotice = funds.some(({ activeFund }) => activeFund);
  const fundPillar = funds.every(({ pillar }) => pillar === 2) ? 'secondPillar' : 'thirdPillar';

  return (
    <>
      <Table columns={columns} dataSource={dataSource} />

      {showActiveFundNotice && (
        <small className="text-muted">
          <FormattedMessage id={`accountStatement.${fundPillar}.activeFundNotice`} />
        </small>
      )}
    </>
  );
};

AccountStatement.propTypes = {
  funds: Types.arrayOf(
    Types.shape({
      isin: Types.string.isRequired,
      name: Types.string.isRequired,
      activeFund: Types.bool,
      contributions: Types.number,
      subtractions: Types.number,
      profit: Types.number,
      price: Types.number,
      unavailablePrice: Types.number,
    }),
  ).isRequired,
};

export default AccountStatement;
