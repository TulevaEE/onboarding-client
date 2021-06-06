import { hasContactDetailsAmlCheck } from './amlSelector';

describe('amlSelector', () => {
  it('checks whether you have the contact details aml check', () => {
    const missingAmlChecks = [{ type: 'CONTACT_DETAILS', success: false }];
    expect(hasContactDetailsAmlCheck(missingAmlChecks)).toBe(false);
  });
});
