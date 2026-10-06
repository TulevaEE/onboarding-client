import React, { useContext, useEffect } from 'react';
import { act, render, screen } from '@testing-library/react';

import {
  forgetRememberedMobileIdPerson,
  forgetRememberedSmartIdAccount,
  getRememberedMobileIdPerson,
} from '../common/api';
import { KnownRememberedPeople, RememberWhoThisBrowserRemembers } from './rememberedPeople';

jest.mock('../common/api');

const mockGetRememberedMobileIdPerson = getRememberedMobileIdPerson as jest.MockedFunction<
  typeof getRememberedMobileIdPerson
>;

const MobileIdPerson = () => {
  const people = useContext(KnownRememberedPeople);
  useEffect(() => people?.ensure('mobileIdPerson'), [people]);
  const person = people?.state.mobileIdPerson;
  return <output>{person === undefined ? 'asking' : person?.firstName ?? 'nobody'}</output>;
};

const NotYou = () => {
  const people = useContext(KnownRememberedPeople);
  return (
    <button type="button" onClick={() => people?.forget()}>
      Not you?
    </button>
  );
};

describe('who this browser remembers', () => {
  let answer: (person: { firstName: string } | null) => void;

  beforeEach(() => {
    mockGetRememberedMobileIdPerson.mockReset();
    mockGetRememberedMobileIdPerson.mockImplementation(
      () =>
        new Promise((resolve) => {
          answer = resolve;
        }),
    );
  });

  it('asks the server once for the whole page, however many tabs ask', async () => {
    render(
      <RememberWhoThisBrowserRemembers>
        <MobileIdPerson />
        <MobileIdPerson />
      </RememberWhoThisBrowserRemembers>,
    );

    await act(async () => answer({ firstName: 'Mari' }));

    expect(mockGetRememberedMobileIdPerson).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('status').map((status) => status.textContent)).toEqual([
      'Mari',
      'Mari',
    ]);
  });

  it('keeps a person forgotten by Not you? forgotten when an older answer arrives late', async () => {
    render(
      <RememberWhoThisBrowserRemembers>
        <MobileIdPerson />
        <NotYou />
      </RememberWhoThisBrowserRemembers>,
    );

    act(() => screen.getByRole('button', { name: 'Not you?' }).click());
    await act(async () => answer({ firstName: 'Mari' }));

    expect(screen.getByRole('status')).toHaveTextContent('nobody');
    expect(forgetRememberedMobileIdPerson).toHaveBeenCalled();
    expect(forgetRememberedSmartIdAccount).toHaveBeenCalled();
  });
});
