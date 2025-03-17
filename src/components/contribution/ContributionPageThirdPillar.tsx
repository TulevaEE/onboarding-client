import React from 'react';
import { FormattedMessage } from 'react-intl';
import { ContributionSection } from './ContributionSection';
import { usePageTitle } from '../common/usePageTitle';

export const ContributionPageThirdPillar: React.FunctionComponent = () => {
  usePageTitle('pageTitle.thirdPillarContributions');
  return (
    <ContributionSection pillar={3}>
      <FormattedMessage id="contributions.title.3rd" />
    </ContributionSection>
  );
};
