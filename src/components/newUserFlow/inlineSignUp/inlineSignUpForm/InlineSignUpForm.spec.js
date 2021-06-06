import React from 'react';
import { shallow } from 'enzyme';

import { InlineSignUpForm } from './InlineSignUpForm';

describe('InlineSignUpForm', () => {
  let component;
  let props;

  beforeEach(() => {
    props = { translations: { translate: () => '' } };
    component = shallow(<InlineSignUpForm {...props} />);
  });

  it('renders component', () => {
    expect(component);
  });

  it('has correct statute link', () => {
    expect(
      component.contains(
        '<a href="https://tuleva.ee/wp-content/uploads/2017/10/P%C3%B5hikiri-Tulundus%C3%BChistu-Tuleva.pdf"',
      ),
    );
  });
});
