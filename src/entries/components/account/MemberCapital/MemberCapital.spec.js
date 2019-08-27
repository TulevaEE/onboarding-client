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

  it('passes sum of capital as column footer', () => {
    component = shallow(
      <MemberCapital
        value={{
          capitalPayment: 10000,
          profit: 1000,
          membershipBonus: 100,
          workCompensation: 10,
          unvestedWorkCompensation: 1,
        }}
      />,
    );

    expect(component.find(Table).prop('columns')[1].footer).toEqual(<Euro amount={11111} />);
  });

  const passedDataKeys = () =>
    component
      .find(Table)
      .prop('dataSource')
      .map(({ key }) => key);
});
