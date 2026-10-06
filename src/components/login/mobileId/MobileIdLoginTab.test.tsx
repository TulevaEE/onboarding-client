import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';

import translations from '../../translations';
import { MobileIdLoginTab } from './MobileIdLoginTab';
import { MOBILE_ID_PHONE_NUMBER_REQUIRED } from './MobileIdLoginForm';
import { PII_CLASS } from '../../tracking/piiMarkup';
import { expectQuietLinkUnder } from '../../../test/expectQuietLinkUnder';
import {
  forgetRememberedMobileIdPerson,
  forgetRememberedSmartIdAccount,
  getRememberedMobileIdPerson,
} from '../../common/api';

jest.mock('../../common/api');

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

const mockGetRememberedMobileIdPerson = getRememberedMobileIdPerson as jest.MockedFunction<
  typeof getRememberedMobileIdPerson
>;
const mockForgetRememberedMobileIdPerson = forgetRememberedMobileIdPerson as jest.MockedFunction<
  typeof forgetRememberedMobileIdPerson
>;

describe('Mobile-ID login tab', () => {
  const renderTab = (startError?: string) =>
    render(
      <IntlProvider locale="en" messages={translations.en}>
        <MobileIdLoginTab
          phoneNumber=""
          personalCode=""
          onPhoneNumberChange={jest.fn()}
          onPersonalCodeChange={jest.fn()}
          onMobileIdSubmit={jest.fn()}
          startError={startError}
        />
      </IntlProvider>,
    );

  beforeEach(() => {
    mockDispatch.mockReset();
    mockGetRememberedMobileIdPerson.mockReset();
    mockForgetRememberedMobileIdPerson.mockReset();
    mockForgetRememberedMobileIdPerson.mockResolvedValue(undefined);
  });

  afterEach(() => window.localStorage.clear());

  it('offers the remembered person nothing but the login as them and the way out', async () => {
    mockGetRememberedMobileIdPerson.mockResolvedValue({ firstName: 'Aadu' });
    const { container } = renderTab();

    expect(await screen.findByRole('button', { name: 'Continue as Aadu' })).toBeInTheDocument();
    expect(container).toHaveTextContent(/^Continue as AaduNot you\?$/);
  });

  it('marks the remembered first name as personal data for analytics', async () => {
    mockGetRememberedMobileIdPerson.mockResolvedValue({ firstName: 'Aadu' });
    renderTab();

    expect(await screen.findByText('Aadu')).toHaveClass(PII_CLASS);
  });

  it("starts the remembered person's login", async () => {
    mockGetRememberedMobileIdPerson.mockResolvedValue({ firstName: 'Aadu' });
    renderTab();

    userEvent.click(await screen.findByRole('button', { name: 'Continue as Aadu' }));

    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it('offers somebody else a quiet link under the login as the remembered person', async () => {
    mockGetRememberedMobileIdPerson.mockResolvedValue({ firstName: 'Aadu' });
    renderTab();

    expectQuietLinkUnder(
      await screen.findByRole('button', { name: 'Continue as Aadu' }),
      screen.getByRole('button', { name: 'Not you?' }),
    );
  });

  it('asks for the identity code and number once the remembered number no longer works', async () => {
    mockGetRememberedMobileIdPerson.mockResolvedValue({ firstName: 'Aadu' });
    renderTab(MOBILE_ID_PHONE_NUMBER_REQUIRED);

    expect(await screen.findByLabelText('Identity code')).toBeInTheDocument();
    expect(screen.queryByText(/Aadu/)).not.toBeInTheDocument();
  });

  it('treats a failed remembered person lookup as nobody remembered', async () => {
    mockGetRememberedMobileIdPerson.mockRejectedValue(new Error('offline'));
    renderTab();

    expect(await screen.findByLabelText('Identity code')).toBeInTheDocument();
  });

  it('forgets the remembered person for Smart-ID on this browser too when they say Not you?', async () => {
    mockGetRememberedMobileIdPerson.mockResolvedValue({ firstName: 'Aadu' });
    renderTab();

    userEvent.click(await screen.findByRole('button', { name: 'Not you?' }));

    expect(await screen.findByLabelText('Identity code')).toBeInTheDocument();
    expect(forgetRememberedSmartIdAccount).toHaveBeenCalled();
  });

  it('forgets the remembered person and their remember me choice for somebody else', async () => {
    window.localStorage.setItem('rememberMe', 'true');
    mockGetRememberedMobileIdPerson.mockResolvedValue({ firstName: 'Aadu' });
    renderTab();

    userEvent.click(await screen.findByRole('button', { name: 'Not you?' }));

    expect(await screen.findByLabelText('Identity code')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Remember me' })).not.toBeChecked();
    expect(mockForgetRememberedMobileIdPerson).toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
