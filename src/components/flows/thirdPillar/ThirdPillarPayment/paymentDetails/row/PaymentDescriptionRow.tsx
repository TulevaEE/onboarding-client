import React from 'react';
import { FormattedMessage } from 'react-intl';
import { InfoTooltip } from '../../../../../common/infoTooltip/InfoTooltip';
import { PaymentDetailRow } from './PaymentDetailRow';

export const PaymentDescriptionRow: React.FunctionComponent<{
  personalCode: string;
  label: React.ReactNode;
}> = ({ personalCode, label }) => (
  <PaymentDetailRow
    label={label}
    value={`30101119828, IK:${personalCode}, EE3600001707`}
    tooltip={
      <InfoTooltip name="third-pillar-payment-description">
        <FormattedMessage id="thirdPillarPayment.processingCodeAndPersonalCode" />
      </InfoTooltip>
    }
  />
);
