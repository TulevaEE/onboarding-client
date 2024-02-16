import React from 'react';
import { shallow } from 'enzyme';
import { MemberStatusBox } from './MemberStatusBox';
import StatusBoxRow from '../statusBoxRow';

describe('MemberStatusBox', () => {
  const loading = false;
  const memberNumber = 123;
  const memberJoinDate = '2024-02-16T12:15:10Z';
  const component = shallow(
    <MemberStatusBox
      loading={loading}
      memberNumber={memberNumber}
      memberJoinDate={memberJoinDate}
    />,
  );

  it('renders the full component', () => {
    expect(component).toMatchSnapshot();
  });

  it('does not show action when still loading', () => {
    component.setProps({ loading: true });
    expect(component.find(StatusBoxRow).prop('showAction')).toBeFalsy();
  });

  it('offers to join when not member', () => {
    component.setProps({ memberNumber: null });
    expect(component).toMatchSnapshot();
  });
});
