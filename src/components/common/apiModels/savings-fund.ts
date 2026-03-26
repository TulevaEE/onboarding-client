export type SavingsFundWithdrawal = {
  amount: number;
  currency: 'EUR';
  iban: string;
};

export type BusinessRegistryValidatedData = {
  name: { value: string; errors: unknown[] };
  registryCode: { value: string; errors: unknown[] };
  status: {
    value: string; // enum
    errors: unknown[];
  };
  address: { value: string; errors: unknown[] };
  businessActivity: {
    value: string; // enum
    errors: unknown[];
  };
  legalForm: {
    value: string;
    errors: [];
  };
  naceCode: {
    value: string;
    errors: [];
  };
  relatedPersons: {
    value: [
      {
        personalCode: string;
        name: string;
        boardMember: boolean;
        shareholder: boolean;
        beneficialOwner: boolean;
        ownershipPercent: number | null;
        kycStatus: string; // enum
      },
    ];
    errors: unknown[];
  };
};
