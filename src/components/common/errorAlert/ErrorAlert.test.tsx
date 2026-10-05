import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import translations from '../../translations';
import ErrorAlert from './ErrorAlert';

jest.unmock('react-intl');

describe('ErrorAlert', () => {
  it('balances the lines of a message of a sentence or two, so a narrow card never leaves its last words on a line of their own', () => {
    render(
      <IntlProvider locale="et" messages={translations.et}>
        <ErrorAlert description="smart.id.timeout" />
      </IntlProvider>,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(
      'Smart‑ID ei saanud kinnitust õigel ajal. Palun proovi uuesti.',
    );
    expect(alert).toHaveClass('text-balance');
  });
});
