import React from 'react';
import { FormattedMessage } from 'react-intl';
import { ContributionSection } from './ContributionSection';
import { usePageTitle } from '../common/usePageTitle';

export const ContributionPageSecondPillar: React.FunctionComponent = () => {
  usePageTitle('pageTitle.secondPillarContributions');
  return (
    <ContributionSection pillar={2}>
      <FormattedMessage id="contributions.title.2nd" />
    </ContributionSection>
  );
};
