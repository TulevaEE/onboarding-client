import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import translations from '../../translations/translations.en.json';
import estonianTranslations from '../../translations/translations.et.json';
import ErrorMessage from './ErrorMessage';

const MESSAGES = { en: translations, et: estonianTranslations };

describe('ErrorMessage', () => {
  it('links a missing ID software to its installation instructions', () => {
    render(
      <IntlProvider locale="en" messages={translations}>
        <ErrorMessage errors={{ errors: [{ code: 'web.eid.id.software.missing' }] }} />
      </IntlProvider>,
    );

    expect(screen.getByText(/ID.software is not installed/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Install\sit from id\.ee$/ })).toHaveAttribute(
      'href',
      'https://www.id.ee/en/article/install-id-software/',
    );
  });

  it.each([
    [
      'id.card.signing.certificate.revoked',
      'en',
      /^The signing certificate on your ID.card has been revoked or suspended\. You can renew it at a Police and Border Guard Board service point\. Until then, log in with Smart.ID or Mobile.ID to sign\.$/,
    ],
    [
      'id.card.signing.certificate.revoked',
      'et',
      /^Sinu ID.kaardi allkirjastamise sertifikaat on tühistatud või peatatud\. Selle saab uuendada Politsei- ja Piirivalveameti teeninduses\. Seni logi allkirjastamiseks sisse Smart.ID või mobiil.ID.ga\.$/,
    ],
    [
      'signature.not.awaited',
      'en',
      /^This contract is not waiting for your signature right now\. It may have been cancelled\.$/,
    ],
    [
      'signature.not.awaited',
      'et',
      /^See leping ei oota praegu sinu allkirja\. Võimalik, et see on tühistatud\.$/,
    ],
    [
      'signature.session.entity.mismatch',
      'en',
      /^Signing was started for another document\. Please start signing again\.$/,
    ],
    [
      'signature.session.entity.mismatch',
      'et',
      /^Allkirjastamist alustati teise dokumendi jaoks\. Palun alusta allkirjastamist uuesti\.$/,
    ],
  ] as const)('explains the signing refusal %s in %s', (code, language, explanation) => {
    render(
      <IntlProvider locale={language} messages={MESSAGES[language]}>
        <ErrorMessage errors={{ errors: [{ code }] }} />
      </IntlProvider>,
    );

    expect(screen.getByText(explanation)).toBeInTheDocument();
  });
});
