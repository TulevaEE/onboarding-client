import React from 'react';
import { FormattedMessage } from 'react-intl';
import { ContributionSection } from './ContributionSection';

export const ContributionPageThirdPillar: React.FunctionComponent = () => {
  return (
    <>
      <ContributionSection pillar={3}>
        <FormattedMessage id="contributions.title.3rd" />
      </ContributionSection>
    </>
  );
};
