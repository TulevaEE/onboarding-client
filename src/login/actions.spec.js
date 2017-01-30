import { changePhoneNumber } from './actions';
import { CHANGE_PHONE_NUMBER } from './constants';

describe('Login actions', () => {
  it('can change phone number', () => {
    const phoneNumber = '12312312312';
    const action = changePhoneNumber(phoneNumber);
    expect(action).toEqual({
      phoneNumber,
      type: CHANGE_PHONE_NUMBER,
    });
  });
});
