import React from 'react';
import { FormattedMessage } from 'react-intl';
import { InfoTooltip } from '../../../../../common';

const accountNumber: { [bank: string]: string } = {
  swedbank: 'EE362200221067235244',
  seb: 'EE141010220263146225',
  lhv: 'EE547700771002908125',
  luminor: 'EE961700017004379157',
};

type Bank = 'swedbank' | 'seb' | 'lhv' | 'luminor';

export const AccountNumberRow: React.FunctionComponent<{
  bank: Bank;
  children: React.ReactNode;
}> = ({ bank, children }) => (
  <tr>
    <td className="align-top text-right">{children}:</td>
    <>
      <td className="align-bottom pl-2">
        <b>{accountNumber[bank]}</b>
      </td>
      <td className="pl-2 d-none d-sm-block">
        <InfoTooltip name={`third-pillar-payment-bank-${bank}`}>
          <FormattedMessage id={`thirdPillarPayment.accountNumber.${bank}`} />
        </InfoTooltip>
      </td>
    </>
  </tr>
);
