import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import NonMember from './NonMember';

describe('NonMember', () => {
  let component;

  beforeEach(() => {
    component = shallow(<NonMember />);
  });

  it('renders component', () => {
    expect(component);
  });

  it('renders title and intro', () => {
    expect(
      component.contains(
        <p className="mb-4 mt-5 lead">
          <Message dangerouslyTranslateInnerHTML="new.user.flow.non.member.title" />
        </p>,
      ),
    ).toBe(true);
    expect(
      component.contains(
        <p>
          <Message dangerouslyTranslateInnerHTML="new.user.flow.non.member.intro" />
        </p>,
      ),
    ).toBe(true);
  });
});
