import React from 'react';

export const PaymentAmountRow: React.FunctionComponent<{
  paymentAmount: string;
  children: React.ReactNode[];
}> = ({ paymentAmount, children }) => (
  <>
    {paymentAmount && Number(paymentAmount) > 0 ? (
      <tr>
        <td className="align-top text-right">{children[0]}:</td>
        <td className="align-bottom pl-2">
          {children[1] && (
            <>
              <b>{children[1]}</b>
              <br />
            </>
          )}
          <b>{Number(paymentAmount).toFixed(2)} EUR</b>
        </td>
      </tr>
    ) : null}
  </>
);
