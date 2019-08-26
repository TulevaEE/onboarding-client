import React from 'react';
import Types from 'prop-types';
import { Message } from 'retranslate';

import Table from '../../common/table';
import { formatAmountForCurrency } from '../../common/utils';

const MemberCapital = ({
  value: { capitalPayment, profit, membershipBonus, workCompensation, unvestedWorkCompensation },
}) => (
  <Table>
    <thead>
      <tr>
        <th>
          <Message>overview.table.header.instrument</Message>
        </th>
        <th>
          <Message>overview.table.header.value</Message>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <Message>member.capital.capital.payment</Message>
        </td>
        <td>{formatAmountForCurrency(capitalPayment)}</td>
      </tr>
      <tr>
        <td>
          <Message>member.capital.profit</Message>
        </td>
        <td>{formatAmountForCurrency(profit)}</td>
      </tr>
      <tr>
        <td>
          <Message>member.capital.member.bonus</Message>
        </td>
        <td>{formatAmountForCurrency(membershipBonus)}</td>
      </tr>
      {workCompensation ? (
        <tr>
          <td>
            <Message>member.capital.work.compensation</Message>
          </td>
          <td>{formatAmountForCurrency(workCompensation)}</td>
        </tr>
      ) : null}
      {unvestedWorkCompensation ? (
        <tr>
          <td>
            <Message>member.capital.unvested.work.compensation</Message>
          </td>
          <td>{formatAmountForCurrency(unvestedWorkCompensation)}</td>
        </tr>
      ) : null}
    </tbody>
    <tfoot>
      <tr>
        <td>
          <Message>overview.total</Message>
        </td>
        <td>
          {formatAmountForCurrency(
            capitalPayment + membershipBonus + profit + unvestedWorkCompensation + workCompensation,
          )}
        </td>
      </tr>
    </tfoot>
  </Table>
);

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
