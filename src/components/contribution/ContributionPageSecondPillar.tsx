import React from 'react';
import { FormattedMessage } from 'react-intl';
import { ContributionSection } from './ContributionSection';

export const ContributionPageSecondPillar: React.FunctionComponent = () => {
  return (
    <>
      <ContributionSection pillar={2}>
        <FormattedMessage id="contributions.title.2nd" />
      </ContributionSection>
    </>
  );
};
