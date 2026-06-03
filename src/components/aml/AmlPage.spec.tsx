import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import UpdateUserForm from '../contact-details/updateUserForm';
import { AmlPage } from './AmlPage';
import OccupationAgreement from './OccupationAgreement';
import ResidencyAgreement from './ResidencyAgreement';
import PoliticallyExposedPersonAgreement from './PoliticallyExposedPersonAgreement';

describe('AML Page', () => {
  let component: ShallowWrapper;
  let props;
  beforeEach(() => {
    props = {};
    component = shallow(<AmlPage {...props} />);
  });
  it('shows update user form', () => {
    const saveUser = () => null;
    component.setProps({ saveUser });
    expect(component.find(UpdateUserForm).length).toBe(1);
  });
  it('renders residency above the politically exposed person question', () => {
    const order = component
      .find(UpdateUserForm)
      .children()
      .map((child) => child.type());
    expect(order).toEqual([
      OccupationAgreement,
      ResidencyAgreement,
      PoliticallyExposedPersonAgreement,
    ]);
  });
});
