import React from 'react';
import { FormattedMessage } from 'react-intl';
import { InfoTooltip } from '../../../../../common';

export const PaymentDescriptionRow: React.FunctionComponent<{
  bank?: string;
  pensionAccountNumber?: string;
  children: React.ReactNode;
}> = ({ bank, pensionAccountNumber, children }) => (
  <tr>
    <td className="align-top text-right">{children}:</td>
    <td className="align-bottom pl-2">
      <b>
        {bank !== 'other' && <span>30101119828, EE3600001707</span>}
        {bank === 'other' && <span>30101119828, PK:{pensionAccountNumber}, EE3600001707</span>}
      </b>
    </td>
    <td className="pl-2 d-none d-sm-block">
      {bank !== 'other' && (
        <InfoTooltip name="third-pillar-payment-description">
          <FormattedMessage id="thirdPillarPayment.processingCode" />
        </InfoTooltip>
      )}
      {bank === 'other' && (
        <InfoTooltip name="third-pillar-payment-description">
          <FormattedMessage id="thirdPillarPayment.processingCodeAndPensionAccountNumber" />
        </InfoTooltip>
      )}
    </td>
  </tr>
);
