import React from 'react';
import { FormattedMessage } from 'react-intl';
import { FundPensionChoice } from './prefill';

export const ChoiceMadeNote = ({ choice }: { choice: FundPensionChoice }) => (
  <p className="payout-note">
    <FormattedMessage
      id="futureMe.choiceMade.fundPension"
      values={{ pillar: choice.pillar, startYear: choice.startYear, startAge: choice.startAge }}
    />
  </p>
);
