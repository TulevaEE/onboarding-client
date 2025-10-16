import React from 'react';
import { FormattedMessage } from 'react-intl';
import { InfoTooltip } from '../../../../../common/infoTooltip/InfoTooltip';
import { PaymentDetailRow } from './PaymentDetailRow';

const accountNumber: { [bank: string]: string } = {
  swedbank: 'EE362200221067235244',
  seb: 'EE141010220263146225',
  lhv: 'EE547700771002908125',
  luminor: 'EE961700017004379157',
};

type Bank = 'swedbank' | 'seb' | 'lhv' | 'luminor';

export const AccountNumberRow: React.FunctionComponent<{
  bank: Bank;
  label: React.ReactNode;
}> = ({ bank, label }) => (
  <PaymentDetailRow
    label={label}
    value={accountNumber[bank]}
    tooltip={
      <InfoTooltip name={`third-pillar-payment-bank-${bank}`}>
        <FormattedMessage id={`thirdPillarPayment.accountNumber.${bank}`} />
      </InfoTooltip>
    }
  />
);
