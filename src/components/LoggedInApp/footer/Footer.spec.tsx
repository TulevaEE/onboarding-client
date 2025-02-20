import { shallow } from 'enzyme';

import { FormattedMessage } from 'react-intl';
import { Footer } from '.';

describe('Footer', () => {
  it('renders info about the company', () => {
    const component = shallow(<Footer />);
    expect(component.contains(<FormattedMessage id="footer.name" />)).toBe(true);
    expect(component.contains(<FormattedMessage id="footer.address" />)).toBe(true);
    expect(component.contains(<FormattedMessage id="footer.registration.code" />)).toBe(true);

    expect(component.find('a[href^="mailto:"]').exists()).toBe(true);
    expect(component.find('a[href^="tel:"]').exists()).toBe(true);
  });
});
