import React from 'react';
import { shallow } from 'enzyme';
import MemberCapital from '.';

import Table from '../../common/table';
import Euro from '../../common/Euro';

describe('Member capital', () => {
  const alwaysExistingKeys = ['payment', 'profit', 'bonus'];

  let component;
  it('passes data that exists for everyone to table', () => {
    component = shallow(<MemberCapital />);

    expect(passedDataKeys()).toStrictEqual(alwaysExistingKeys);
  });

  it('passes work compensation to table when exists', () => {
    component = shallow(<MemberCapital value={{ workCompensation: 123 }} />);

    expect(passedDataKeys()).toStrictEqual([...alwaysExistingKeys, 'work']);
  });

  it('passes unvested work compensation to table when exists', () => {
    component = shallow(<MemberCapital value={{ unvestedWorkCompensation: 123 }} />);

    expect(passedDataKeys()).toStrictEqual([...alwaysExistingKeys, 'unvestedWork']);
  });

  it('passes total sum of capital as column footer', () => {
    component = shallow(<MemberCapital value={{ total: 11111 }} />);

    expect(component.find(Table).prop('columns')[1].footer).toEqual(<Euro amount={11111} />);
  });

  const passedDataKeys = () =>
    component
      .find(Table)
      .prop('dataSource')
      .map(({ key }) => key);
});
