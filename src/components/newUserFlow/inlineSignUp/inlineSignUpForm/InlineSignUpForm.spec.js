import React from 'react';
import { shallow } from 'enzyme';

import { InlineSignUpForm } from './InlineSignUpForm';

describe('InlineSignUpForm', () => {
  let component;

  beforeEach(() => {
    component = shallow(<InlineSignUpForm />);
  });

  it('renders component', () => {
    expect(component).toMatchSnapshot();
  });

  it('has correct statute link', () => {
    expect(
      component.contains(
        '<a href="https://tuleva.ee/wp-content/uploads/2017/10/P%C3%B5hikiri-Tulundus%C3%BChistu-Tuleva.pdf"',
      ),
    );
  });
});
