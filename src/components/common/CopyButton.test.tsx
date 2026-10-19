import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import translations from '../translations';
import { CopyButton } from './CopyButton';

jest.unmock('react-intl');

beforeEach(() => {
  Object.defineProperty(window.navigator, 'clipboard', {
    value: { writeText: jest.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
});

describe('CopyButton', () => {
  test('tells screen readers that the icon button copied, as the labelled one does', async () => {
    render(
      <IntlProvider locale="en" messages={translations.en}>
        <CopyButton textToCopy="99812345678" />
      </IntlProvider>,
    );
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    userEvent.click(screen.getByRole('button', { name: 'Copy' }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Copied'));
  });
});
