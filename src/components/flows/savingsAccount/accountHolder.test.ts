import { mockUser } from '../../../test/backend-responses';
import { accountHolderFor, accountHolderName, accountHolderPersonalCode } from './accountHolder';

const roleless = { ...mockUser, role: undefined };

describe('accountHolderFor', () => {
  it('is self when the user acts under their own personal code', () => {
    expect(accountHolderFor(mockUser)).toBe('self');
  });

  it('is self when the user has no active role', () => {
    expect(accountHolderFor(roleless)).toBe('self');
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

describe('account holder identity', () => {
  it('uses the role when one is active', () => {
    const user = {
      ...mockUser,
      role: { type: 'LEGAL_ENTITY' as const, code: '12345678', name: 'Acme OÜ' },
    };
    expect(accountHolderPersonalCode(user)).toBe('12345678');
    expect(accountHolderName(user)).toBe('Acme OÜ');
  });

  it('falls back to the logged-in person when no role is active', () => {
    expect(accountHolderPersonalCode(roleless)).toBe(mockUser.personalCode);
    expect(accountHolderName(roleless)).toBe('John Doe');
  });
});
