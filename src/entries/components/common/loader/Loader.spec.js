import React from 'react';
import { shallow } from 'enzyme';
import Loader from './Loader';

describe('Loader', () => {
  it("passes the given className to it's children", () => {
    const component = shallow(<Loader />);
    const topLevelClass = () =>
      component
        .find('div')
        .first()
        .prop('className');
    expect(topLevelClass()).not.toContain('this-is-a-class');
    component.setProps({ className: 'this-is-a-class' });
    expect(topLevelClass()).toContain('this-is-a-class');
  });
});
