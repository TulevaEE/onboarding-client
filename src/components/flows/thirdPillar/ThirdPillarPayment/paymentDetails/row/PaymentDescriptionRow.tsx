import React from 'react';
import { FormattedMessage } from 'react-intl';
import { InfoTooltip } from '../../../../../common';

export const PaymentDescriptionRow: React.FunctionComponent<{
  personalCode: string;
  children: React.ReactNode;
}> = ({ personalCode, children }) => (
  <tr>
    <td className="align-top text-right">{children}:</td>
    <td className="align-bottom pl-2">
      <b>
        <span>30101119828, IK:{personalCode}, EE3600001707</span>
      </b>
    </td>
    <td className="pl-2 d-none d-sm-block">
      <InfoTooltip name="third-pillar-payment-description">
        <FormattedMessage id="thirdPillarPayment.processingCodeAndPersonalCode" />
      </InfoTooltip>
    </td>
  </tr>
);
