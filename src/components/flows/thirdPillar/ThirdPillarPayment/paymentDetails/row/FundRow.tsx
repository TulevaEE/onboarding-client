import React from 'react';
import { FormattedMessage } from 'react-intl';

export const FundRow: React.FunctionComponent<{
  children: React.ReactNode;
}> = ({ children }) => (
  <tr>
    <td className="align-top text-end">{children}:</td>
    <td className="align-bottom ps-2">
      <b>
        <FormattedMessage id="thirdPillarPayment.tuleva3rdPillarFund" />
      </b>
    </td>
    {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
    <td className="d-none d-sm-table-cell"> </td>
  </tr>
);
