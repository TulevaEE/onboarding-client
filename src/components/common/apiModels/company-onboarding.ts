// A field validation error from the KYB initial-validation endpoint: a machine-readable
// code plus a localized human message. The code drives client behaviour (e.g. the
// identity-verification dead-end) without parsing copy, and errors that concern
// specific people carry them as structured `persons` rather than in the message. The
// field is omitted entirely when there are none, and `name` is null when the backend
// knows only the personal code.
export type ValidationError = {
  code: string;
  message: string;
  persons?: { personalCode: string; name: string | null }[];
};

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
