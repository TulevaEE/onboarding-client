import React from 'react';

export const PaymentAmountRow: React.FunctionComponent<{
  amount: string;
  children: React.ReactNode[];
}> = ({ amount, children }) => (
  <>
    {amount && Number(amount) > 0 ? (
      <tr>
        <td className="align-top text-end">{children[0]}:</td>
        <td className="align-bottom ps-2">
          {children[1] && (
            <>
              <b>{children[1]}</b>
              <br />
            </>
          )}
          <b>{Number(amount).toFixed(2)} EUR</b>
        </td>
        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
        <td className="d-none d-sm-table-cell"> </td>
      </tr>
    ) : null}
  </>
);
