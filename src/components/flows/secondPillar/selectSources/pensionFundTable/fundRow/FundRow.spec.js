import React from 'react';
import { shallow } from 'enzyme';
import { FormattedMessage } from 'react-intl';
import Euro from '../../../../../common/Euro';
import FundRow from './FundRow';

describe('Fund row', () => {
  let component;

  beforeEach(() => {
    component = shallow(<FundRow />);
  });

  it("renders the fund's name", () => {
    component.setProps({ name: 'i am a name' });
    const displayName = <FormattedMessage id="i am a name" />;
    expect(component.contains(displayName)).toBe(true);
    expect(component.find(FormattedMessage).first().parent().is('b')).toBe(false);
  });

  it("renders the fund's name highlighted if component is highlighted", () => {
    component.setProps({ name: 'i am a highlighted name', highlighted: true });
    const displayName = <FormattedMessage id="i am a highlighted name" />;
    expect(component.contains(displayName)).toBe(true);
    expect(component.find(FormattedMessage).first().parent().is('b')).toBe(true);
  });

  it('renders the formatted value of the fund', () => {
    component.setProps({ price: 1234.56 });
    expect(hasElementWithAmount(1234.56)).toBe(true);
    expect(isElementWithAmountHighlighted(1234.56)).toBe(false);
  });

  it('adds a star to the name of an active fund row', () => {
    expect(component.text()).not.toContain('*');
    component.setProps({ active: true });
    expect(component.text()).toContain('*');
  });

  it('renders the formatted value of a fund, highlighted if component is highlighted', () => {
    component.setProps({ price: 1234.56, highlighted: true });
    expect(hasElementWithAmount(1234.56)).toBe(true);
    expect(isElementWithAmountHighlighted(1234.56)).toBe(true);
  });

  const hasElementWithAmount = (amount) =>
    component.containsMatchingElement(<Euro amount={amount} />);
  const isElementWithAmountHighlighted = (amount) =>
    component.find('b').containsMatchingElement(<Euro amount={amount} />);
});
