import { Role } from '../../apiModels';

export const rolesProfiles: Record<string, Role[]> = {
  PERSON_ONLY: [{ type: 'PERSON', code: '39001011234', name: 'John Doe' }],
  PERSON_AND_LEGAL_ENTITY: [
    { type: 'PERSON', code: '39001011234', name: 'John Doe' },
    { type: 'LEGAL_ENTITY', code: '12345678', name: 'Test OÜ' },
  ],
};
