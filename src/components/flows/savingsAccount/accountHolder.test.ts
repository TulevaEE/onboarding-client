import { mockUser } from '../../../test/backend-responses';
import { accountHolderFor } from './accountHolder';

describe('accountHolderFor', () => {
  it('is self when the user acts under their own personal code', () => {
    expect(accountHolderFor(mockUser)).toBe('self');
  });

  it('is company when the user acts as a legal entity', () => {
    const user = {
      ...mockUser,
      role: { type: 'LEGAL_ENTITY' as const, code: '12345678', name: 'Acme OÜ' },
    };
    expect(accountHolderFor(user)).toBe('company');
  });

  it('is child when the user acts as another person', () => {
    const user = {
      ...mockUser,
      role: { type: 'PERSON' as const, code: '51201011234', name: 'Junior Doe' },
    };
    expect(accountHolderFor(user)).toBe('child');
  });
});
