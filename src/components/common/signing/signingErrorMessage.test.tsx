import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import translations from '../../translations';
import ErrorMessage from '../errorMessage';
import { toSigningErrorResponse } from './signingErrorResponse';

const showSigningFailure = (failure: unknown, locale: 'et' | 'en') =>
  render(
    <IntlProvider locale={locale} messages={translations[locale]}>
      <ErrorMessage errors={toSigningErrorResponse(failure, 'MANDATE').body} />
    </IntlProvider>,
  );

describe('the error a signer sees', () => {
  it.each([
    ['et', /^Allkirjastamine on ajutiselt häiritud\.$/],
    ['en', /^Signing is temporarily unavailable\.$/],
  ] as const)(
    'tells the signer in %s that signing is temporarily unavailable when the backend cannot complete signatures right now',
    (locale, explanation) => {
      showSigningFailure(
        {
          status: 503,
          body: {
            errors: [
              {
                code: 'signature.service.unavailable',
                message: 'Signing is temporarily unavailable, please retry later.',
              },
            ],
          },
        },
        locale,
      );

      expect(screen.getByText(explanation)).toBeInTheDocument();
      expect(screen.queryByText(/please retry later/)).not.toBeInTheDocument();
    },
  );

  it('tells the signer that signing did not complete, without the raw server error, when the backend fails with a code nobody wrote an explanation for', () => {
    showSigningFailure(
      {
        status: 500,
        body: {
          errors: [
            {
              code: 'Internal Server Error',
              message:
                'OCSP request failed. Please check GitHub Wiki for more information: https://github.com/open-eid/digidoc4j/wiki/Questions-&-Answers#if-ocsp-request-has-failed',
            },
          ],
        },
      },
      'et',
    );

    expect(
      screen.getByText(/^Allkirjastamine ei jõudnud lõpuni\. Palun proovi uuesti\.$/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Internal Server Error/)).not.toBeInTheDocument();
    expect(screen.queryByText(/OCSP request failed/)).not.toBeInTheDocument();
  });
});
