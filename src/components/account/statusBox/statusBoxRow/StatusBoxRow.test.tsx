import React from 'react';
import { shallow } from 'enzyme';
import { FormattedMessage } from 'react-intl';
import { StatusBoxRow } from './StatusBoxRow';

describe('Status Box Row', () => {
  let component: any;

  beforeEach(() => {
    component = shallow(<StatusBoxRow />);
  });

  it('renders the name', () => {
    const displayName = <FormattedMessage id="i am a name" />;
    component.setProps({ name: displayName });
    expect(component.contains(displayName)).toBe(true);
  });

  it('renders action button if row status not ok', () => {
    const action = <FormattedMessage id="do next" />;
    component.setProps({ showAction: true, children: action });
    expect(component.contains(action)).toBe(true);
  });

  it('renders given lines of text', () => {
    component.setProps({ lines: ['aa', 'bb'] });
    expect(component.contains('aa')).toBe(true);
    expect(component.contains('bb')).toBe(true);
  });
});
