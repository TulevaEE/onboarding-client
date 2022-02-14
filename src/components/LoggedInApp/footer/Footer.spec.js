import React from 'react';
import { shallow } from 'enzyme';

import { FormattedMessage } from 'react-intl';
import Footer from './Footer';

describe('Footer', () => {
  it('renders info about the company', () => {
    const component = shallow(<Footer />);
    expect(component.contains(<FormattedMessage id="footer.name" />)).toBe(true);
    expect(component.contains(<FormattedMessage id="footer.address" />)).toBe(true);
    expect(component.contains(<FormattedMessage id="footer.email" />)).toBe(true);
    expect(component.contains(<FormattedMessage id="footer.phone.number" />)).toBe(true);
    expect(component.contains(<FormattedMessage id="footer.registration.code" />)).toBe(true);
  });
});
