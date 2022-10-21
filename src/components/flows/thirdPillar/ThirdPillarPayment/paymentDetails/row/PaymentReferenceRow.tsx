import React from 'react';
import { FormattedMessage } from 'react-intl';
import { InfoTooltip } from '../../../../../common';

export const PaymentReferenceRow: React.FunctionComponent<{
  pensionAccountNumber: string;
  children: React.ReactNode;
}> = ({ pensionAccountNumber, children }) => (
  <tr>
    <td className="align-top text-right">{children}:</td>
    <td className="align-bottom pl-2">
      <b>{pensionAccountNumber}</b>
    </td>
    <td className="pl-2 d-none d-sm-block">
      <InfoTooltip name="third-pillar-payment-reference">
        <FormattedMessage id="thirdPillarPayment.pensionAccountNumber" />
      </InfoTooltip>
    </td>
  </tr>
);
