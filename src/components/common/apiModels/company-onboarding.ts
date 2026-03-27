export type BusinessRegistryValidatedData = {
  name: { value: string; errors: unknown[] };
  registryCode: { value: string; errors: unknown[] };
  status: {
    value: string; // enum
    errors: unknown[];
  };
  address: {
    value: {
      fullAddress: string;
      street: string;
      city: string;
      postalCode: string;
      countryCode: string | null;
    };
    errors: unknown[];
  };
  businessActivity: {
    value: string; // enum
    errors: unknown[];
  };
  legalForm: {
    value: string;
    errors: unknown[];
  };
  naceCode: {
    value: string;
    errors: unknown[];
  };
  foundingDate: {
    value: string;
    errors: unknown[];
  };
  relatedPersons: {
    value: [
      {
        personalCode: string;
        name: string;
      },
    ];
    errors: unknown[];
  };
};
