import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

const mockUtils = jest.genMockFromModule('../../../common/utils');
jest.mock('../../../common/utils', () => mockUtils);

const PendingExchange = require('./PendingExchange').default;

describe('Pending exchange', () => {
  let component;

  beforeEach(() => {
    const sourceFund = {};
    const targetFund = {};
    component = shallow(<PendingExchange sourceFund={sourceFund} targetFund={targetFund} />);
  });

  it('renders source fund name', () => {
    const sourceFund = { name: 'i am a name', id: '123' };
    const targetFund = { name: 'i am a name', id: '123' };
    component.setProps({ sourceFund, targetFund });
    const displayName = <Message>i am a name</Message>;
    expect(component.contains(displayName)).toBe(true);
  });

  it('renders target fund name', () => {
    const sourceFund = { name: 'i am a name', id: '123' };
    const targetFund = { name: 'i am a name2', id: '123' };
    component.setProps({ sourceFund, targetFund });
    const displayName = <Message>i am a name2</Message>;
    expect(component.contains(displayName)).toBe(true);
  });
});
