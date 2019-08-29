import React from 'react';
import { shallow } from 'enzyme';

import { ReturnComparisonDateSelect } from './ReturnComparisonDateSelect';
import Select from './Select';

describe('Return comparison date select', () => {
  it('translates labels using translate from higher order component', () => {
    const translate = (key: string): string => `translated ${key}`;

    const component = shallow(
      <ReturnComparisonDateSelect
        translations={{ translate }}
        options={[
          { label: 'first key', value: aDate() },
          { label: 'second key', value: anotherDate() },
        ]}
        selectedDate={aDate()}
        onChange={jest.fn()}
      />,
    );

    const select = component.find(Select);
    expect(select.prop('options')).toEqual([
      { label: 'translated first key', value: aDate() },
      { label: 'translated second key', value: anotherDate() },
    ]);
  });

  const aDate = (): string => '2019-08-02';
  const anotherDate = (): string => '2014-12-22';
});
