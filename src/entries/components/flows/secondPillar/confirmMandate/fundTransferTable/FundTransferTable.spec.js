import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import FundTransferTable from './FundTransferTable';

describe('Fund transfer table', () => {
  let component;

  beforeEach(() => {
    component = shallow(<FundTransferTable />);
  });

  it('renders a header', () => {
    expect(
      component.contains(
        <div className="row tv-table__header py-2">
          <div className="col-12 col-sm">
            <Message>confirm.mandate.current.fund</Message>
          </div>
          <div className="col-12 col-sm-2">
            <Message>confirm.mandate.percentage</Message>
          </div>
          <div className="col-12 col-sm">
            <Message>confirm.mandate.future.fund</Message>
          </div>
        </div>,
      ),
    ).toBe(true);
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
    selections.forEach(selection =>
      expect(
        component.contains(
          <div className="row tv-table__row py-2">
            <div className="col-12 col-sm">{selection.sourceFundName}</div>
            <div className="col-12 col-sm-2">{selection.percentage * 100}%</div>
            <div className="col-12 col-sm">
              <b className="highlight">{selection.targetFundName}</b>
            </div>
          </div>,
        ),
      ).toBe(true),
    );
  });
});
