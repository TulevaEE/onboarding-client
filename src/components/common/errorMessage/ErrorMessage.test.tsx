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
      'en',
      /^The signing certificate on your ID.card is not valid/,
      /^The signing certificate on your ID.card is not valid: it has been revoked or suspended\. Read what to do on id\.ee\. Meanwhile, log in with Smart.ID or Mobile.ID to sign\.$/,
      /^Read what to do on id\.ee$/,
      'https://www.id.ee/en/article/validity-of-id-card-certificates/',
    ],
    [
      'et',
      /^Sinu ID.kaardi allkirjastamise sertifikaat ei kehti/,
      /^Sinu ID.kaardi allkirjastamise sertifikaat ei kehti: see on tühistatud või peatatud\. Mida edasi teha, loe id\.ee lehelt\. Seni logi allkirjastamiseks sisse Smart.ID või mobiil.ID.ga\.$/,
      /^loe id\.ee lehelt$/,
      'https://www.id.ee/artikkel/id-kaardi-sertifikaatide-kehtivus/',
    ],
  ] as const)(
    'explains in %s that the ID-card signing certificate is not valid and links to what id.ee says to do about it',
    (language, opening, explanation, linkText, href) => {
      render(
        <IntlProvider locale={language} messages={MESSAGES[language]}>
          <ErrorMessage errors={{ errors: [{ code: 'id.card.signing.certificate.revoked' }] }} />
        </IntlProvider>,
      );

      expect(screen.getByText(opening)).toHaveTextContent(explanation);
      expect(screen.getByRole('link', { name: linkText })).toHaveAttribute('href', href);
    },
  );

  it.each([
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
