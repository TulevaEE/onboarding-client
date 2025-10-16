import React from 'react';
import { FormattedMessage } from 'react-intl';
import { InfoTooltip } from '../../../../../common/infoTooltip/InfoTooltip';
import { PaymentDetailRow } from './PaymentDetailRow';

export const AccountNameRow: React.FunctionComponent<{
  label: React.ReactNode;
}> = ({ label }) => (
  <PaymentDetailRow
    label={label}
    value="AS Pensionikeskus"
    tooltip={
      <InfoTooltip name="third-pillar-payment-account-name">
        <FormattedMessage id="thirdPillarPayment.pensionRegistry" />
      </InfoTooltip>
    }
  />
);
