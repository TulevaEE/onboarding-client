import { JSX } from 'react';
import { Control, FieldPath, UseFormSetValue } from 'react-hook-form';
import { CitizenshipStep } from './CitizenshipStep';
import { ResidencyStep } from './ResidencyStep';
import { ContactDetailsStep } from './ContactDetailsStep';
import { PepStep } from './PepStep';
import { OnboardingFormData } from './types';
import { KycIdentity } from './types.api';

export type OnboardingStep = {
  component: JSX.Element;
  fields: FieldPath<OnboardingFormData>[];
};

export const buildIdentitySteps = (control: Control<OnboardingFormData>): OnboardingStep[] => [
  {
    component: <CitizenshipStep key="citizenship" control={control} />,
    fields: ['citizenship'],
  },
  {
    component: <ResidencyStep key="residency" control={control} />,
    fields: ['address.countryCode', 'address.street', 'address.city', 'address.postalCode'],
  },
  {
    component: <ContactDetailsStep key="contact-details" control={control} />,
    fields: ['email'],
  },
  {
    component: <PepStep key="pep" control={control} />,
    fields: ['pepSelfDeclaration'],
  },
];

// When the steps are skipped, these prefilled values are what the submit
// re-sends — every KYC survey must carry the full identity block.
export const applyIdentityToForm = (
  identity: KycIdentity,
  setValue: UseFormSetValue<OnboardingFormData>,
): void => {
  if (identity.citizenship) {
    setValue('citizenship', identity.citizenship);
  }
  if (identity.address) {
    setValue('address', identity.address);
  }
  if (identity.email) {
    setValue('email', identity.email);
  }
  if (identity.phoneNumber) {
    setValue('phoneNumber', identity.phoneNumber);
  }
  if (identity.pepSelfDeclaration) {
    setValue('pepSelfDeclaration', identity.pepSelfDeclaration);
  }
};
