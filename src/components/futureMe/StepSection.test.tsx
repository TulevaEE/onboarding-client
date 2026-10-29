import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import translations from '../translations';
import { FirstPillarChoice } from './FirstPillarChoice';
import { StepSection } from './StepSection';
import { FutureMeStep } from './steps';

const renderStep = ({ isEmbedded }: { isEmbedded: boolean }) =>
  render(
    <IntlProvider locale="et" messages={translations.et}>
      <StepSection
        step={FutureMeStep.AGE_66_PLUS}
        headingId="future-me-step-heading"
        kicker="66+ aastat"
        title="Pensionipõlv"
        isEmbedded={isEmbedded}
      >
        <FirstPillarChoice
          idPrefix="future-me-choice"
          title="Pensionieas uuesti"
          intro="Vali pension"
          special={900}
          oldAge={700}
          larger="special"
          chosen="special"
          onChange={jest.fn()}
        />
      </StepSection>
    </IntlProvider>,
  );

describe('StepSection', () => {
  it('puts the section titles of a step under its own heading', () => {
    renderStep({ isEmbedded: false });

    expect(screen.getByRole('heading', { level: 2, name: 'Pensionipõlv' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Pensionieas uuesti' }),
    ).toBeInTheDocument();
  });

  it('puts the section titles of an embedded step under the result row it opens in', () => {
    renderStep({ isEmbedded: true });

    expect(screen.queryByRole('heading', { name: 'Pensionipõlv' })).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 5, name: 'Pensionieas uuesti' }),
    ).toBeInTheDocument();
  });
});
