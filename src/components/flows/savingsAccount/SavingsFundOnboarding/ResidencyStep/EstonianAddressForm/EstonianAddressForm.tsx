import { FC, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Control, useController } from 'react-hook-form';

import { OnboardingFormData } from '../../types';

import './EstonianAddressForm.scss';

const ADDRESS_CONTAINER_ID = 'maaAmetAddressComponent';
const ADDRESS_INPUT_ID = 'estonianAddressInput';
const APARTMENT_SELECT_ID = 'estonianApartmentSelect';
const APARTMENT_LABEL_ID = 'estonianApartmentLabel';

type MaaAmetAddress = {
  lahiaadress: string;
  omavalitsus: string;
  sihtnumber: string;
};

type MaaAmetInstance = {
  hideResult: () => void;
  setAddress: (address: string, search: boolean) => void;
};

const isMaaAmetAddress = (address: unknown): address is MaaAmetAddress => {
  if (
    typeof address === 'object' &&
    address !== null &&
    'lahiaadress' in address &&
    'omavalitsus' in address &&
    'sihtnumber' in address
  ) {
    const addr = address as Record<string, unknown>;
    return (
      typeof addr.lahiaadress === 'string' &&
      typeof addr.omavalitsus === 'string' &&
      typeof addr.sihtnumber === 'string'
    );
  }
  return false;
};

type EstonianAddressFormProps = {
  control: Control<OnboardingFormData>;
};

export const EstonianAddressForm: FC<EstonianAddressFormProps> = ({ control }) => {
  const [selectedAddress, setSelectedAddress] = useState<MaaAmetAddress | null>(null);
  const intl = useIntl();

  const validationRules = {
    required: {
      value: true,
      message: intl.formatMessage({
        id: 'flows.savingsFundOnboarding.residencyStep.estonianAddress.required',
      }),
    },
  };

  const { field: streetField, fieldState: streetFieldState } = useController({
    control,
    name: 'address.street',
    rules: validationRules,
  });
  const { field: cityField, fieldState: cityFieldState } = useController({
    control,
    name: 'address.city',
    rules: validationRules,
  });
  const { field: postalCodeField, fieldState: postalCodeFieldState } = useController({
    control,
    name: 'address.postalCode',
    rules: validationRules,
  });

  const language = intl.locale.slice(0, 2);
  const error = streetFieldState.error || cityFieldState.error || postalCodeFieldState.error;

  useEffect(() => {
    if (selectedAddress) {
      streetField.onChange(selectedAddress.lahiaadress);
      cityField.onChange(selectedAddress.omavalitsus);
      postalCodeField.onChange(selectedAddress.sihtnumber);
    }
  }, [selectedAddress]);

  useEffect(() => {
    const container = document.getElementById(ADDRESS_CONTAINER_ID);
    let instance: MaaAmetInstance | null = null;
    let observer: MutationObserver | null = null;

    if (!container) {
      return undefined;
    }

    // Clear any existing content from previous renders
    container.innerHTML = '';

    const updateApartmentLabel = () => {
      const apartmentSelect = container.querySelector<HTMLSelectElement>('.inads-appartment');
      const existingLabel = document.getElementById(APARTMENT_LABEL_ID);

      // If select exists and is visible, ensure wrapper with label exists
      if (apartmentSelect && !apartmentSelect.classList.contains('hidden')) {
        apartmentSelect.id = APARTMENT_SELECT_ID;

        if (!existingLabel) {
          // Create wrapper row with Bootstrap grid classes
          const wrapper = document.createElement('div');
          wrapper.className = 'row apartment-row';

          const column = document.createElement('div');
          column.className = 'col-sm-4';

          const label = document.createElement('label');
          label.id = APARTMENT_LABEL_ID;
          label.htmlFor = APARTMENT_SELECT_ID;
          label.className = 'form-label';
          label.textContent = intl.formatMessage({
            id: 'flows.savingsFundOnboarding.residencyStep.apartment.label',
          });

          // Move select into the column and build the structure
          column.appendChild(label);
          apartmentSelect.parentNode?.insertBefore(wrapper, apartmentSelect);
          column.appendChild(apartmentSelect);
          wrapper.appendChild(column);
        }
      } else if (existingLabel) {
        // If select doesn't exist or is hidden, remove the wrapper (which contains label and select)
        existingLabel.closest('.apartment-row')?.remove();
      }
    };

    const handleAddressSelected = (e: Event) => {
      const eventDetail = (e as CustomEvent).detail;
      const address: unknown = eventDetail?.[0];

      if (isMaaAmetAddress(address)) {
        setSelectedAddress({
          lahiaadress: address.lahiaadress,
          omavalitsus: address.omavalitsus,
          sihtnumber: address.sihtnumber,
        });
      }
      // TODO: Handle case where address is not valid/full
      instance?.hideResult();

      // Update apartment label after address selection
      updateApartmentLabel();
    };

    const handleInaadressLoaded = () => {
      const formContainer = document.getElementById(ADDRESS_CONTAINER_ID);

      if (formContainer) {
        formContainer.style.removeProperty('height');
        formContainer.style.setProperty('min-height', 'fit-content');

        const input = formContainer.querySelector<HTMLInputElement>('.inads-input');
        if (input) {
          input.id = ADDRESS_INPUT_ID;
        }
      }
    };

    // Watch for DOM changes to handle apartment select being added/removed
    observer = new MutationObserver((mutations) => {
      const hasRelevantChange = mutations.some(
        (mutation) => mutation.type === 'childList' || mutation.type === 'attributes',
      );
      if (hasRelevantChange) {
        updateApartmentLabel();
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });

    document.addEventListener('addressSelected', handleAddressSelected);
    document.addEventListener('inaadressLoaded', handleInaadressLoaded);

    // @ts-expect-error maa-amet script with no TS support
    instance = new InAadress({
      container: container.id,
      mode: 3,
      ihist: '0',
      appartment: 1,
      focus: true,
      lang: language,
    });

    return () => {
      document.removeEventListener('addressSelected', handleAddressSelected);
      document.removeEventListener('inaadressLoaded', handleInaadressLoaded);
      observer?.disconnect();

      if (container) {
        container.innerHTML = '';
      }

      instance = null;
    };
  }, [language, intl]);

  return (
    <div>
      <label htmlFor={ADDRESS_INPUT_ID} className="form-label w-100">
        <FormattedMessage id="flows.savingsFundOnboarding.residencyStep.street.label" />
      </label>
      <div id={ADDRESS_CONTAINER_ID} />
      {error && error.message ? (
        <p className="m-0 text-danger fs-base" role="alert">
          {error.message}
        </p>
      ) : null}
    </div>
  );
};
