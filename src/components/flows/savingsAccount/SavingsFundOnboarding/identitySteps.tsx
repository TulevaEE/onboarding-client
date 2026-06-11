import { FC, JSX, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Control, FieldPath, UseFormSetValue } from 'react-hook-form';
import { CitizenshipStep } from './CitizenshipStep';
import { ResidencyStep } from './ResidencyStep';
import { ContactDetailsStep } from './ContactDetailsStep';
import { PepStep } from './PepStep';
import { IdentityFormFields } from './types';
import { KycIdentity } from './types.api';
import { useKycIdentity } from '../../../common/apiHooks';

export type OnboardingStep<T extends IdentityFormFields = IdentityFormFields> = {
  component: JSX.Element;
  fields: FieldPath<T>[];
};

// The step components only ever touch the identity fields, so narrowing the
// control is structurally safe for any form that includes them.
const asIdentityControl = <T extends IdentityFormFields>(
  control: Control<T>,
): Control<IdentityFormFields> => control as unknown as Control<IdentityFormFields>;

export const buildIdentitySteps = <T extends IdentityFormFields>(
  control: Control<T>,
): OnboardingStep<T>[] => {
  const identityControl = asIdentityControl(control);
  return [
    {
      component: <CitizenshipStep key="citizenship" control={identityControl} />,
      fields: ['citizenship'] as FieldPath<T>[],
    },
    {
      component: <ResidencyStep key="residency" control={identityControl} />,
      fields: [
        'address.countryCode',
        'address.street',
        'address.city',
        'address.postalCode',
      ] as FieldPath<T>[],
    },
    {
      component: <ContactDetailsStep key="contact-details" control={identityControl} />,
      fields: ['email'] as FieldPath<T>[],
    },
    {
      component: <PepStep key="pep" control={identityControl} />,
      fields: ['pepSelfDeclaration'] as FieldPath<T>[],
    },
  ];
};

// When the steps are skipped, these prefilled values are what the submit
// re-sends — every KYC survey must carry the full identity block.
export const applyIdentityToForm = <T extends IdentityFormFields>(
  identity: KycIdentity,
  setValue: UseFormSetValue<T>,
): void => {
  const set = setValue as unknown as UseFormSetValue<IdentityFormFields>;
  if (identity.citizenship) {
    set('citizenship', identity.citizenship);
  }
  if (identity.address) {
    set('address', identity.address);
  }
  if (identity.email) {
    set('email', identity.email);
  }
  if (identity.phoneNumber) {
    set('phoneNumber', identity.phoneNumber);
  }
  if (identity.pepSelfDeclaration) {
    set('pepSelfDeclaration', identity.pepSelfDeclaration);
  }
};

// Resolves "is the identity on file?" once per mount, prefilling the form with
// whatever is known. Freezes the answer — and only accepts a post-mount fetch,
// because React Query first serves stale cached data from an earlier visit
// while refetching — so the flow's shape never changes mid-flow.
export const useIdentityOnFile = <T extends IdentityFormFields>(
  setValue: UseFormSetValue<T>,
): {
  identityOnFile: boolean | null;
  identityLoadFailed: boolean;
  retryIdentityLoad: () => void;
} => {
  const { data: identity, isError, isFetchedAfterMount, refetch } = useKycIdentity();
  const [identityOnFile, setIdentityOnFile] = useState<boolean | null>(null);

  useEffect(() => {
    if (identity && isFetchedAfterMount && identityOnFile === null) {
      applyIdentityToForm(identity, setValue);
      setIdentityOnFile(identity.complete);
    }
  }, [identity, isFetchedAfterMount, identityOnFile, setValue]);

  return {
    identityOnFile,
    identityLoadFailed: isError && identityOnFile === null,
    retryIdentityLoad: () => {
      refetch();
    },
  };
};

// The identity fetch decides a flow's shape, so it must resolve before the
// user can interact — on failure, block and offer an explicit retry.
export const IdentityLoadError: FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="col-12 col-md-10 col-lg-7 mx-auto">
    <div className="d-flex flex-column gap-4 align-items-start">
      <div className="alert alert-danger m-0 w-100" role="alert">
        <FormattedMessage id="flows.savingsFundOnboarding.identityError" />
      </div>
      <button type="button" className="btn btn-lg btn-primary" onClick={onRetry}>
        <FormattedMessage id="flows.savingsFundOnboarding.identityError.retry" />
      </button>
    </div>
  </div>
);
