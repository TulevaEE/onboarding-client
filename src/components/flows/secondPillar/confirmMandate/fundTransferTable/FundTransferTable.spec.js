import React from 'react';
import { shallow } from 'enzyme';

import { FormattedMessage } from 'react-intl';
import { FundTransferTable } from './FundTransferTable';

describe('Fund transfer table', () => {
  let component;

  beforeEach(() => {
    component = shallow(<FundTransferTable />);
  });

  it('renders a header', () => {
    expect(component.contains(<FormattedMessage id="confirm.mandate.transferExisting" />)).toBe(
      true,
    );
  });

  it('renders an exchange row for every selection', () => {
    const selections = [
      {
        percentage: 0.5,
        sourceFundIsin: 'source 1',
        targetFundIsin: 'target 1',
        sourceFundName: 'a',
        targetFundName: 'c',
      },
      {
        percentage: 1,
        sourceFundIsin: 'source 2',
        targetFundIsin: 'target 2',
        sourceFundName: 'b',
        targetFundName: 'd',
      },
    ];
    component.setProps({ selections });
    selections.forEach((selection) => {
      expect(component.contains(<b>{selection.sourceFundName}</b>)).toBe(true);
      expect(
        component.contains(<span className="highlight">{selection.targetFundName}</span>),
      ).toBe(true);
      expect(component.contains(<b>{selection.percentage * 100}%</b>)).toBe(true);
    });
  });
});
