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
  relatedPersons: {
    value: [
      {
        personalCode: string;
        name: string;
        boardMember: true;
        shareholder: true;
        beneficialOwner: true;
        ownershipPercent: number;
        kycStatus: string; // enum
      },
    ];
    errors: unknown[];
  };
};
