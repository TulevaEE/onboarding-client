// A field validation error from the KYB initial-validation endpoint. Historically a
// plain localized string; the backend is moving to a { code, message } pair so the
// machine-readable code can drive behaviour without parsing copy. We accept both shapes
// so the client tolerates either backend version during rollout.
export type ValidationError = string | { code: string; message: string };

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
