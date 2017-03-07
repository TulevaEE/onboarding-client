import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import FundTransferMandate from './FundTransferMandate';

describe('Fund transfer mandate', () => {
  let component;
  let selection;

  beforeEach(() => {
    selection = {
      sourceFundIsin: 'source',
      targetFundIsin: 'target',
      sourceFundName: 'source name',
      percentage: 1,
    };
    component = shallow(<FundTransferMandate selection={selection} />);
  });

  it('renders the name of the fund you are transferring from and the name of the target', () => {
    expect(component.contains(<b>source name</b>)).toBe(true);
    expect(component.contains(<Message>target.funds.target.title</Message>)).toBe(true);
  });

  it('renders the transfer percentage as a word when all of it is transferred', () => {
    expect(component.contains(<Message>confirm.mandate.amounts.all</Message>)).toBe(true);
    expect(component.text).not.toContain('100%');
  });

  it('renders the transfer percentage as a number when some if it is transferred', () => {
    component.setProps({ selection: { ...selection, percentage: 0.5 } });
    expect(component.contains(<Message>confirm.mandate.amounts.all</Message>)).toBe(false);
    expect(component.text()).toContain('50%');
  });
});
