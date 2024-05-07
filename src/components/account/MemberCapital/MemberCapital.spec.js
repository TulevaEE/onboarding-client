import React from 'react';
import { shallow } from 'enzyme';
import MemberCapital from '.';

import Table from '../../common/table';
import { CapitalType } from '../../common/apiModels';

describe('Member capital', () => {
  let component;
  it('passes data to table', () => {
    component = shallow(<MemberCapital />);

    expect(passedDataKeys()).toStrictEqual([]);
  });

  it('passes work compensation to table when exists', () => {
    component = shallow(
      <MemberCapital
        rows={[
          {
            type: CapitalType.WORK_COMPENSATION,
            contributions: 300,
            profit: 150,
            value: 450,
            currency: 'EUR',
          },
        ]}
      />,
    );

    expect(passedDataKeys()).toStrictEqual(['WORK_COMPENSATION']);
  });

  const passedDataKeys = () =>
    component
      .find(Table)
      .prop('dataSource')
      .map(({ key }) => key);
});
