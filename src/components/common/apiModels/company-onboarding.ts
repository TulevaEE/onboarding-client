// A field validation error from the KYB initial-validation endpoint: a machine-readable
// code plus a localized human message. The code drives client behaviour (e.g. the
// identity-verification dead-end) without parsing copy.
export type ValidationError = { code: string; message: string };

export type BusinessRegistryValidatedData = {
  name: { value: string; errors: ValidationError[] };
  registryCode: { value: string; errors: ValidationError[] };
  status: {
    value: string; // enum
    errors: ValidationError[];
  };
  address: {
    value: {
      fullAddress: string;
      street: string;
      city: string;
      postalCode: string;
      countryCode: string | null;
    };
    errors: ValidationError[];
  };
  businessActivity: {
    value: string; // enum
    errors: ValidationError[];
  };
  legalForm: {
    value: string;
    errors: ValidationError[];
  };
  naceCode: {
    value: string;
    errors: ValidationError[];
  };
  foundingDate: {
    value: string;
    errors: ValidationError[];
  };
  relatedPersons: {
    value: [
      {
        personalCode: string;
        name: string;
      },
    ];
    errors: ValidationError[];
  };
};
