import { CHANGE_PHONE_NUMBER } from './constants';

// TODO: add missing actions
export function changePhoneNumber(phoneNumber) { // eslint-disable-line
  return { type: CHANGE_PHONE_NUMBER, phoneNumber };
}
