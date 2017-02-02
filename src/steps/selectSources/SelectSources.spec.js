import React from 'react';
import { shallow } from 'enzyme';
import { Link } from 'react-router';
import { Message } from 'retranslate';

import { Loader } from '../../common';
import PensionFundTable from './pensionFundTable';
import { SelectSources } from './SelectSources';

describe('Select sources step', () => {
  let component;

  beforeEach(() => {
    component = shallow(<SelectSources />);
  });

  it('renders a loader when loading pension funds', () => {
    component.setProps({ loadingPensionFunds: true });
    expect(component.find(Loader).length).toBe(1);
    expect(component.get(0)).toEqual(<Loader className="align-middle" />);
  });

  it('does not render a loader when pension funds loaded', () => {
    component.setProps({ loadingPensionFunds: false });
    expect(component.find(Loader).length).toBe(0);
  });

  it('renders a title', () => {
    expect(component.contains(<Message>select.sources.current.status</Message>)).toBe(true);
  });

  it('renders a pension funds table with given funds', () => {
    const pensionFunds = [{ iAmAFund: true }, { iAmAlsoAFund: true }];
    component.setProps({ pensionFunds });
    expect(component.contains(<PensionFundTable funds={pensionFunds} />)).toBe(true);
  });

  it('renders an explanation of the savings calculations', () => {
    expect(component.contains(<Message>select.sources.calculation.info</Message>)).toBe(true);
  });

  it('renders a link to the next step', () => {
    expect(component.contains(
      <Link className="btn btn-primary mt-4 mb-4" to="/steps/select-fund">
        <Message>steps.next</Message>
      </Link>,
    )).toBe(true);
  });

  // TODO: write tests once selectExchangeSources supports selecting parts of funds.
});
