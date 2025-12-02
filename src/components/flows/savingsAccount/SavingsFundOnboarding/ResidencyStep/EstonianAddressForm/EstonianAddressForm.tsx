import { FC, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Control, useController } from 'react-hook-form';

import { OnboardingFormData } from '../../types';

const ADDRESS_CONTAINER_ID = 'maaAmetAddressComponent';

type MaaAmetAddress = {
  lahiaadress: string;
  omavalitsus: string;
  sihtnumber: string;
};

type MaaAmetInstance = {
  hideResult: () => void;
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
  const { field: streetField } = useController({ control, name: 'address.street' });
  const { field: cityField } = useController({ control, name: 'address.city' });
  const { field: postalCodeField } = useController({ control, name: 'address.postalCode' });
  const language = intl.locale.slice(0, 2);

  useEffect(() => {
    if (selectedAddress) {
      streetField.onChange(selectedAddress.lahiaadress);
      cityField.onChange(selectedAddress.omavalitsus);
      postalCodeField.onChange(selectedAddress.sihtnumber);
    }
  }, [selectedAddress]);

  useEffect(() => {
    let instance: MaaAmetInstance | null = null;
    const container = document.getElementById(ADDRESS_CONTAINER_ID);

    if (!container) {
      return undefined;
    }

    // Clear any existing content from previous renders
    container.innerHTML = '';

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
    };

    const handleInaadressLoaded = () => {
      const formContainer = document.getElementById(ADDRESS_CONTAINER_ID);

      if (formContainer) {
        formContainer.style.removeProperty('height');
        formContainer.style.setProperty('min-height', 'fit-content');
      }
    };

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

      if (container) {
        container.innerHTML = '';
      }

      instance = null;
    };
  }, [language]);

  return (
    <div>
      {/* FIXME: Unable to attach htmlFor to label because the input is rendered by an external script */}
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label className="form-label w-100">
        <FormattedMessage id="flows.savingsFundOnboarding.residencyStep.street.label" />
        <div id={ADDRESS_CONTAINER_ID} />
      </label>
    </div>
  );
};
