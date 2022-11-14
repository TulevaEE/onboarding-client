import React from 'react';

export const PaymentAmountRow: React.FunctionComponent<{
  amount: string;
  children: React.ReactNode[];
}> = ({ amount, children }) => (
  <>
    {amount && Number(amount) > 0 ? (
      <tr>
        <td className="align-top text-right">{children[0]}:</td>
        <td className="align-bottom pl-2">
          {children[1] && (
            <>
              <b>{children[1]}</b>
              <br />
            </>
          )}
          <b>{Number(amount).toFixed(2)} EUR</b>
        </td>
        <td className="d-none d-sm-table-cell" />
      </tr>
    ) : null}
  </>
);
