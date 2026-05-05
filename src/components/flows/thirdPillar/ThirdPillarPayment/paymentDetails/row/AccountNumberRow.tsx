import React from 'react';
import { FormattedMessage } from 'react-intl';
import { InfoTooltip } from '../../../../../common/infoTooltip/InfoTooltip';
import { THIRD_PILLAR_BANK_IBANS, ThirdPillarBank } from '../bankAccounts';
import { PaymentDetailRow } from './PaymentDetailRow';

export const AccountNumberRow: React.FunctionComponent<{
  bank: ThirdPillarBank;
  label: React.ReactNode;
}> = ({ bank, label }) => (
  <PaymentDetailRow
    label={label}
    value={THIRD_PILLAR_BANK_IBANS[bank]}
    tooltip={
      <InfoTooltip name={`third-pillar-payment-bank-${bank}`}>
        <FormattedMessage id={`thirdPillarPayment.accountNumber.${bank}`} />
      </InfoTooltip>
    }
  />
);
