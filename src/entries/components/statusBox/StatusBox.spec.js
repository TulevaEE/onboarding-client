import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';
import { StatusBox } from './StatusBox';
import StatusBoxRow from './statusBoxRow';

describe('Status Box', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {};
    component = shallow(<StatusBox {...props} />);
  });

  it('renders status box title', () => {
    expect(component.contains(<Message>account.status.choices</Message>)).toBe(true);
  });

  it('renders status box rows', () => {
    expect(component.contains(<StatusBoxRow>account.status.choices</StatusBoxRow>)).toBe(true);
  });
});
