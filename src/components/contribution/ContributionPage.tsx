import React from 'react';
import { FormattedMessage } from 'react-intl';
import { ContributionSection } from './ContributionSection';

export const ContributionPage: React.FunctionComponent = () => {
  return (
    <>
      <ContributionSection>
        <FormattedMessage id="contributions.title" />
      </ContributionSection>
    </>
  );
};
