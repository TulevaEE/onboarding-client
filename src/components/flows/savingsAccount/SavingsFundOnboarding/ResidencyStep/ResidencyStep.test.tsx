import { screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import { renderWrapped } from '../../../../../test/utils';
import { ResidencyStep } from './ResidencyStep';
import { IdentityFormFields } from '../types';
import translations from '../../../../translations';
import { mockInAadress } from '../../../../../test/identityStepFills';
import { isInsidePii } from '../../../../tracking/piiMarkup';

const ResidencyStepWrapper = ({ defaultCountryCode = 'FI' }: { defaultCountryCode?: string }) => {
  const { control } = useForm<IdentityFormFields>({
    defaultValues: {
      citizenship: [],
      address: {
        countryCode: defaultCountryCode as 'FI',
        street: '',
        city: '',
        postalCode: '',
      },
      email: '',
      pepSelfDeclaration: null,
    },
  });

  return (
    <IntlProvider locale="et" messages={translations.et}>
      <ResidencyStep control={control} />
    </IntlProvider>
  );
};

describe('ResidencyStep', () => {
  test('renders residency heading', () => {
    renderWrapped(<ResidencyStepWrapper />);

    expect(screen.getByRole('heading', { name: 'Sinu alaline elukoht' })).toBeInTheDocument();
  });

  test('renders country select', () => {
    renderWrapped(<ResidencyStepWrapper />);

    expect(screen.getByText('Riik')).toBeInTheDocument();
  });

  test('marks the Estonian address search as personal data for analytics', async () => {
    mockInAadress();
    renderWrapped(<ResidencyStepWrapper defaultCountryCode="EE" />);

    expect(isInsidePii(await screen.findByPlaceholderText('Enter address'))).toBe(true);
  });

  test('marks the popup the address search opens outside the form as personal data for analytics', async () => {
    (global as any).InAadress = jest.fn().mockImplementation(({ container }) => {
      document.dispatchEvent(new Event('inaadressLoaded'));
      const popup = document.createElement('div');
      popup.id = `${container}_popup`;
      popup.classList.add('in-ads-popup', 'hidden');
      popup.textContent = 'Telliskivi 60/1';
      document.body.append(popup);
      return { destroy: jest.fn() };
    });
    renderWrapped(<ResidencyStepWrapper defaultCountryCode="EE" />);

    const popup = await screen.findByText('Telliskivi 60/1');
    expect(isInsidePii(popup)).toBe(true);
    popup.remove();
  });

  test('renders address fields for non-Estonian residence', () => {
    renderWrapped(<ResidencyStepWrapper defaultCountryCode="FI" />);

    expect(screen.getByLabelText('Linn')).toBeInTheDocument();
    expect(screen.getByLabelText('Postiindeks')).toBeInTheDocument();
    expect(screen.getByLabelText('Aadress (tänav, maja, korter)')).toBeInTheDocument();
  });
});
