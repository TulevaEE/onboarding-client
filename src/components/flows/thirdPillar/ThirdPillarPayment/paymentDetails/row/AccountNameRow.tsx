import React from 'react';
import { FormattedMessage } from 'react-intl';
import { InfoTooltip } from '../../../../../common';

export const AccountNameRow: React.FunctionComponent<{
  children: React.ReactNode;
}> = ({ children }) => (
  <tr>
    <td className="align-top text-right">{children}:</td>
    <td className="align-bottom pl-2">
      <b>AS Pensionikeskus</b>
    </td>
    <td className="pl-2 d-none d-sm-block">
      <InfoTooltip name="third-pillar-payment-account-name">
        <FormattedMessage id="thirdPillarPayment.pensionRegistry" />
      </InfoTooltip>
    </td>
  </tr>
);
