import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { ConfirmThirdPillarMandate } from './ConfirmThirdPillarMandate';
import FundTransferTable from '../../secondPillar/confirmMandate/fundTransferTable';
import { AuthenticationLoader, Loader } from '../../../common';

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

  it('redirects to next path only when signed mandate id exists', () => {
    component.setProps({ nextPath: '/next-path' });
    const redirects = () => component.contains(<Redirect to="/next-path" />);

    expect(redirects()).toBe(false);
    component.setProps({ signedMandateId: 123 });
    expect(redirects()).toBe(true);
  });

  it('redirects to previous path only when no address', () => {
    component.setProps({ previousPath: '/a-path' });
    const redirects = () => component.contains(<Redirect to="/a-path" />);

    expect(redirects()).toBe(true);
    component.setProps({ isAddressFilled: true });
    expect(redirects()).toBe(false);
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
    const amlProps = {
      isResident: true,
      isPoliticallyExposed: true,
      occupation: 'PRIVATE_SECTOR',
    };
    component.setProps({
      exchangeExistingUnits: true,
      exchangeableSourceFunds: [
        { isin: 'EE123', name: 'First fund' },
        { isin: 'EE456', name: 'Second fund' },
      ],
      selectedFutureContributionsFund: { isin: 'EE789', name: 'Third fund' },
      onPreview,
      ...amlProps,
    });

    expect(onPreview).not.toBeCalled();
    previewButton().simulate('click');
    expect(onPreview).toBeCalledWith(
      {
        fundTransferExchanges: [
          { amount: 1, sourceFundIsin: 'EE123', targetFundIsin: 'EE789' },
          { amount: 1, sourceFundIsin: 'EE456', targetFundIsin: 'EE789' },
        ],
        futureContributionFundIsin: 'EE789',
      },
      amlProps,
    );
  });

  it('signs mandate on sign button click', () => {
    const onSign = jest.fn();
    const amlProps = {
      isResident: true,
      isPoliticallyExposed: true,
      occupation: 'PRIVATE_SECTOR',
    };
    component.setProps({
      exchangeExistingUnits: true,
      exchangeableSourceFunds: [
        { isin: 'EE123', name: 'First fund' },
        { isin: 'EE456', name: 'Second fund' },
      ],
      selectedFutureContributionsFund: { isin: 'EE789', name: 'Third fund' },
      onSign,
      ...amlProps,
    });

    expect(onSign).not.toBeCalled();
    signButton().simulate('click');
    expect(onSign).toBeCalledWith(
      {
        fundTransferExchanges: [
          { amount: 1, sourceFundIsin: 'EE123', targetFundIsin: 'EE789' },
          { amount: 1, sourceFundIsin: 'EE456', targetFundIsin: 'EE789' },
        ],
        futureContributionFundIsin: 'EE789',
      },
      amlProps,
    );
  });

  it('has exchange existing funds text and exchange table only when should exchange existing funds', () => {
    const hasText = () =>
      component.contains(<Message>confirmThirdPillarMandate.exchangeExistingUnits</Message>);
    const exchangeTable = () => component.find(FundTransferTable);

    expect(hasText()).toBe(false);
    expect(exchangeTable().exists()).toBe(false);
    component.setProps({
      exchangeExistingUnits: true,
      exchangeableSourceFunds: [
        { isin: 'EE123', name: 'First fund' },
        { isin: 'EE456', name: 'Second fund' },
      ],
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
        percentage: 1,
      },
      {
        sourceFundIsin: 'EE456',
        sourceFundName: 'Second fund',
        targetFundIsin: 'EE789',
        targetFundName: 'Third fund',
        percentage: 1,
      },
    ]);
  });

  it('renders an overlayed authentication loader when you are signing the mandate', () => {
    const onCancelSigningMandate = jest.fn();
    component.setProps({
      onCancelSigningMandate,
    });
    const hasAuthLoader = () => !!component.find(AuthenticationLoader).length;
    expect(hasAuthLoader()).toBe(false);
    component.setProps({
      mandateSigningControlCode: null,
      loadingMandate: true,
    });
    expect(hasAuthLoader()).toBe(true);
  });

  it('renders the authentication loader with a control code', () => {
    component.setProps({
      mandateSigningControlCode: '1337',
    });
    expect(component.find(AuthenticationLoader).prop('controlCode')).toBe('1337');
  });

  it('can cancel signing the mandate', () => {
    const onCancelSigningMandate = jest.fn();
    component.setProps({
      mandateSigningControlCode: '1337',
      onCancelSigningMandate,
    });
    expect(onCancelSigningMandate).not.toHaveBeenCalled();
    component.find(AuthenticationLoader).simulate('cancel');
    expect(onCancelSigningMandate).toHaveBeenCalledTimes(1);
  });

  it('renders the loader when loading source funds', () => {
    component.setProps({ loadingSourceFunds: true });
    expect(component.find(Loader).length).toBe(1);
  });

  it('does not render the loader when source funds are loaded', () => {
    component.setProps({ loadingSourceFunds: false });
    expect(component.find(Loader).length).toBe(0);
  });

  const signButton = () => component.find('button').at(0);
  const previewButton = () => component.find('button').at(1);
});
