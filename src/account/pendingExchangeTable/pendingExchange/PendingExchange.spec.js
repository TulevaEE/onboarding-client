import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

const mockUtils = jest.genMockFromModule('../../../common/utils');
jest.mock('../../../common/utils', () => mockUtils);

const PendingExchange = require('./PendingExchange').default;

describe('Pending exchange', () => {
  let component;

  beforeEach(() => {
    component = shallow(<PendingExchange />);
  });

  it('renders source fund isin', () => {
    component.setProps({ sourceFundIsin: 'i am a isin' });
    const displayName = <Message>i am a isin</Message>;
    expect(component.contains(displayName)).toBe(true);
    expect(component.find(Message).first().parent().is('b')).toBe(false);
  });
});
