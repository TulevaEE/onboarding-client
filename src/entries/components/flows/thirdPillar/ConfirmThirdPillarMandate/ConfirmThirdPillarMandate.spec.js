import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { ConfirmThirdPillarMandate } from './ConfirmThirdPillarMandate';
import FundTransferTable from '../../secondPillar/confirmMandate/fundTransferTable';

describe('ConfirmThirdPillarMandate', () => {
  let component;
  beforeEach(() => {
    component = shallow(
      <ConfirmThirdPillarMandate
        monthlyContribution={1000}
        selectedFutureContributionsFund={{ isin: 'EE123' }}
      />,
    );
  });

  it('redirects to previous path only when no monthly contribution', () => {
    component.setProps({ previousPath: '/a-path' });
    const redirects = () => component.contains(<Redirect to="/a-path" />);

    expect(redirects()).toBe(false);
    component.setProps({ monthlyContribution: null });
    expect(redirects()).toBe(true);
  });

  it('redirects to previous path only when no selected future contributions fund', () => {
    component.setProps({ previousPath: '/a-path' });
    const redirects = () => component.contains(<Redirect to="/a-path" />);

    expect(redirects()).toBe(false);
    component.setProps({ selectedFutureContributionsFund: null });
    expect(redirects()).toBe(true);
  });

  it('has future contributions fund name and message only when future contributions fund is selected', () => {
    const hasMessage = () =>
      component.contains(<Message>confirmThirdPillarMandate.contribution</Message>);
    const hasFundName = () => component.contains(<b className="highlight">A pension fund</b>);

    component.setProps({ selectedFutureContributionsFund: null });
    expect(hasMessage()).toBe(false);
    expect(hasFundName()).toBe(false);
    component.setProps({
      selectedFutureContributionsFund: { isin: 'EE123', name: 'A pension fund' },
    });
    expect(hasMessage()).toBe(true);
    expect(hasFundName()).toBe(true);
  });

  it('redirects to previous path on button click', () => {
    component.setProps({ previousPath: '/a-path' });
    expect(component.find(Link).prop('to')).toBe('/a-path');
  });

  it('gets mandate preview on preview button click', () => {
    const onPreview = jest.fn();
    component.setProps({
      selectedFutureContributionsFund: { isin: 'EE123' },
      onPreview,
    });

    expect(onPreview).not.toBeCalled();
    previewButton().simulate('click');
    expect(onPreview).toBeCalledWith({
      fundTransferExchanges: [],
      futureContributionFundIsin: 'EE123',
    });
  });

  it('signs mandate on sign button click', () => {
    const onSign = jest.fn();
    component.setProps({
      selectedFutureContributionsFund: { isin: 'EE123' },
      onSign,
    });

    expect(onSign).not.toBeCalled();
    signButton().simulate('click');
    expect(onSign).toBeCalledWith({
      fundTransferExchanges: [],
      futureContributionFundIsin: 'EE123',
    });
  });

  it('has exchange existing funds text and exchange table only when should exchange existing funds', () => {
    const hasText = () =>
      component.contains(<Message>confirmThirdPillarMandate.exchangeExistingUnits</Message>);
    const exchangeTable = () => component.find(FundTransferTable);

    expect(hasText()).toBe(false);
    expect(exchangeTable().exists()).toBe(false);
    component.setProps({
      exchangeExistingUnits: true,
      sourceFunds: [{ isin: 'EE123', name: 'First fund' }, { isin: 'EE456', name: 'Second fund' }],
      selectedFutureContributionsFund: { isin: 'EE789', name: 'Third fund' },
    });
    expect(hasText()).toBe(true);
    expect(exchangeTable().exists()).toBe(true);
    expect(exchangeTable().prop('selections')).toEqual([
      {
        sourceFundIsin: 'EE123',
        sourceFundName: 'First fund',
        targetFundIsin: 'EE789',
        targetFundName: 'Third fund',
        percentage: 100,
      },
      {
        sourceFundIsin: 'EE456',
        sourceFundName: 'Second fund',
        targetFundIsin: 'EE789',
        targetFundName: 'Third fund',
        percentage: 100,
      },
    ]);
  });

  const signButton = () => component.find('button').at(0);
  const previewButton = () => component.find('button').at(1);
});
