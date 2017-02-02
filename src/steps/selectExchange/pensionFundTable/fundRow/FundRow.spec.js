import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import FundRow from './FundRow';

describe('Fund row', () => {
  let component;

  beforeEach(() => {
    component = shallow(<FundRow />);
  });

  it('renders the fund\'s name', () => {
    component.setProps({ name: 'i am a name' });
    const displayName = <Message>i am a name</Message>;
    expect(component.contains(displayName)).toBe(true);
    expect(component.find(Message).first().parent().is('b')).toBe(false);
  });

  it('renders the fund\'s name highlighted if component is highlighted', () => {
    component.setProps({ name: 'i am a highlighted name', highlighted: true });
    const displayName = <Message>i am a highlighted name</Message>;
    expect(component.contains(displayName)).toBe(true);
    expect(component.find(Message).first().parent().is('b')).toBe(true);
  });

  it('renders the formatted value of the fund', () => {
    component.setProps({ price: 1234.56, currency: 'EUR' });
    expect(component.text()).toContain('1234.56€');
    expect(component
      .findWhere(node => node.type() === 'div' && node.childAt(0).node === '1234.56€')
      .length,
    ).toBe(1);
  });

  it('renders the formatted value of a fund, highlighted if component is highlighted', () => {
    component.setProps({ price: 1234.56, currency: 'EUR', highlighted: true });
    expect(component.text()).toContain('1234.56€');
    expect(component
      .findWhere(node => node.type() === 'b' && node.childAt(0).node === '1234.56€')
      .length,
    ).toBe(1);
  });
});
