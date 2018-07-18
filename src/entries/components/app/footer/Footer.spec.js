import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import Footer from './Footer';

describe('Footer', () => {
  it('renders info about the company', () => {
    const component = shallow(<Footer />);
    expect(component.contains(<Message>footer.name</Message>)).toBe(true);
    expect(component.contains(<Message>footer.address</Message>)).toBe(true);
    expect(component.contains(<Message>footer.email</Message>)).toBe(true);
    expect(component.contains(<Message>footer.phone.number</Message>)).toBe(true);
    expect(component.contains(<Message>footer.registration.code</Message>)).toBe(true);
  });
});
