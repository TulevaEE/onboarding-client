import { normalizeMobileIdPhoneNumber } from './mobileIdPhoneNumber';

describe('normalizeMobileIdPhoneNumber', () => {
  it.each([
    ['+37255512345', '+37255512345'],
    ['+372 5551 2345', '+37255512345'],
    ['+372 5551 2345', '+37255512345'],
    ['(+372) 555-12-345', '+37255512345'],
    ['+372.555.12345', '+37255512345'],
    ['0037255512345', '+37255512345'],
    ['37255512345', '+37255512345'],
    ['55512345', '+37255512345'],
    ['5551 234', '+3725551234'],
    ['5 5 5 1 2 3 4 5', '+37255512345'],
  ])('reads %p as %p', (typed, canonical) => {
    expect(normalizeMobileIdPhoneNumber(typed)).toEqual({ phoneNumber: canonical });
  });

  it.each(['+358401234567', '00358 40 123 4567', '+1 202 555 0143'])(
    'refuses %p, a number from another country',
    (typed) => {
      expect(normalizeMobileIdPhoneNumber(typed)).toEqual({ problem: 'NOT_ESTONIAN' });
    },
  );

  it.each(['5551', '+372 5551', '+372555123456', '555123456', 'my phone', ''])(
    'asks to check %p, which is no Estonian mobile number',
    (typed) => {
      expect(normalizeMobileIdPhoneNumber(typed)).toEqual({ problem: 'INVALID' });
    },
  );
});
