import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import FundTransferMandate from './FundTransferMandate';

describe('Fund transfer mandate', () => {
  let component;

  beforeEach(() => {
    component = shallow(
      <FundTransferMandate
        fund={{ name: 'test', percentage: 1 }}
        targetFund={{ isin: 'target' }}
      />,
    );
  });

  it('renders the name of the fund you are transferring from and the name of the target', () => {
    expect(component.contains(<b>test</b>)).toBe(true);
    expect(component.contains(<Message>target.funds.target.title</Message>)).toBe(true);
  });

  it('renders the transfer percentage as a word when all of it is transferred', () => {
    component.setProps({ fund: { percentage: 1, name: 'test' } });
    expect(component.contains(<Message>confirm.mandate.amounts.all</Message>)).toBe(true);
    expect(component.text).not.toContain('100%');
  });

  it('renders the transfer percentage as a number when some if it is transferred', () => {
    component.setProps({ fund: { percentage: 0.5, name: 'test' } });
    expect(component.contains(<Message>confirm.mandate.amounts.all</Message>)).toBe(false);
    expect(component.text()).toContain('50%');
  });
});
