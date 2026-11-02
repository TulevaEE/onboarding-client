import React from 'react';
import { FormattedMessage } from 'react-intl';
import { PayoutChoice } from './age60Answers';

export const PayoutChoiceText = ({
  choice,
  endsSecondPillarContributions = false,
}: {
  choice: PayoutChoice;
  endsSecondPillarContributions?: boolean;
}) => (
  <FormattedMessage
    id={`futureMe.payoutChoice.${choice}`}
    values={{ endsSecondPillarContributions: endsSecondPillarContributions ? 'yes' : 'no' }}
  />
);
