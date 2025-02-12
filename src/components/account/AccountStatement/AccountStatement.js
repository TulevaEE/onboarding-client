import React from 'react';
import Types from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';

import { sortBy } from 'lodash';
import Table from '../../common/table';
import { Euro } from '../../common/Euro';
import { getValueSum, getWeightedAverageFee } from './fundSelector';
import { Fees } from '../../common/Percentage/Fees';
import { Shimmer } from '../../common/shimmer/Shimmer';

const AccountStatement = ({ funds, activeFundNotice }) => {
  if (!funds) {
    return <Shimmer height={26} />;
  }
  const { formatMessage } = useIntl();

  const valueSum = getValueSum(funds);

  const weightedAverageFee = valueSum <= 0 ? 0 : getWeightedAverageFee(funds);

  const columns = [
    {
      title: <FormattedMessage id="accountStatement.columns.fund.title" />,
      dataIndex: 'fund',
      footer: <FormattedMessage id="accountStatement.columns.fund.footer" />,
      width100: true,
    },
    {
      title: (
        <>
          <FormattedMessage id="accountStatement.columns.fees.title" />
          &nbsp;%
        </>
      ),
      dataIndex: 'feesPercent',
      footer: <Fees value={weightedAverageFee} />,
    },
    ...(weightedAverageFee * valueSum === 0
      ? []
      : [
          {
            title: (
              <>
                <FormattedMessage id="accountStatement.columns.fees.title" />
                &nbsp;€
              </>
            ),
            dataIndex: 'feesEuro',
            footer: (
              <Euro className="text-body-secondary" amount={-(weightedAverageFee * valueSum)} />
            ),
            hideOnMobile: true,
          },
        ]),
    {
      title: <FormattedMessage id="accountStatement.columns.value.title" />,
      dataIndex: 'value',
      footer: <Euro className="text-bold" amount={valueSum} />,
    },
  ];

  const sortedFunds = sortBy(funds, [
    (fund) => fund.price + fund.unavailablePrice,
    (fund) => fund.activeFund,
  ]).reverse();

  const dataSource = sortedFunds.map((fund) => {
    const fundValue = fund.price + fund.unavailablePrice;
    const isMuted = !fund.activeFund && fundValue === 0;
    const className = isMuted ? 'text-body-secondary' : undefined;
    const prefix = isMuted
      ? formatMessage({ id: 'accountStatement.columns.fund.muted.prefix' })
      : '';
    const suffix = fund.activeFund ? '*' : '';
    const feesEuro = -(fund.ongoingChargesFigure * fundValue);
    return {
      fund: <span className={className}>{`${prefix}${fund.name}${suffix}`}</span>,
      feesPercent: <Fees value={fund.ongoingChargesFigure} />,
      feesEuro: !feesEuro ? <></> : <Euro className="text-body-secondary" amount={feesEuro} />,
      value: !fundValue ? <></> : <Euro className={className} amount={fundValue} />,
      key: fund.isin,
    };
  });

  const showActiveFundNotice = funds.some(({ activeFund }) => activeFund);
  const fundPillar = funds.every(({ pillar }) => pillar === 2) ? 'secondPillar' : 'thirdPillar';

  return (
    <>
      <Table columns={columns} dataSource={dataSource} />

      {showActiveFundNotice && (
        <small className="text-body-secondary">
          {activeFundNotice || (
            <FormattedMessage id={`accountStatement.${fundPillar}.activeFundNotice`} />
          )}
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
  activeFundNotice: Types.node,
};

export default AccountStatement;
