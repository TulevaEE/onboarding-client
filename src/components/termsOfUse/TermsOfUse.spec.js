import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import TermsOfUse from './TermsOfUse';

describe('TermsOfUse', () => {
  let component;

  beforeEach(() => {
    component = shallow(<TermsOfUse />);
  });

  it('renders component with terms of use copy', () => {
    expect(component.contains(<Message>terms.of.use.title</Message>));
    expect(component.contains(<Message>terms.of.use.subheading</Message>));
    expect(component.contains(<Message>terms.of.use.list.item.3</Message>));
    expect(component.find('li').length).toBe(7);
  });
});
