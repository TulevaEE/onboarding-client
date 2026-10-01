import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import translations from '../../translations/translations.en.json';
import ErrorMessage from './ErrorMessage';

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
});
