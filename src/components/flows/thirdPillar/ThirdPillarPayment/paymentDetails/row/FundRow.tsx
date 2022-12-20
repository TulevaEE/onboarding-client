import React from 'react';
import { FormattedMessage } from 'react-intl';

export const FundRow: React.FunctionComponent<{
  children: React.ReactNode;
}> = ({ children }) => (
  <tr>
    <td className="align-top text-right">{children}:</td>
    <td className="align-bottom pl-2">
      <b>
        <FormattedMessage id="thirdPillarPayment.tuleva3rdPillarFund" />
      </b>
    </td>
    <td className="d-none d-sm-table-cell" />
  </tr>
);
