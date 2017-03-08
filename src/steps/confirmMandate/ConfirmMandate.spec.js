import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';
import { Link } from 'react-router';

import { ConfirmMandate } from './ConfirmMandate';
import FundTransferMandate from './fundTransferMandate';
import { Loader, AuthenticationLoader } from '../../common';

describe('Confirm mandate step', () => {
  let component;

  beforeEach(() => {
    component = shallow(<ConfirmMandate />);
  });

  it('renders a loader if it is loading the user or funds', () => {
    const expectComponentToBeLoader = () =>
      expect(component.at(0).node).toEqual(<Loader className="align-middle" />);
    const expectComponentNotToBeLoader = () =>
      expect(component.at(0).node).not.toEqual(<Loader className="align-middle" />);

    component.setProps({ loadingUser: true });
    expectComponentToBeLoader();

    component.setProps({ loadingUser: false, exchange: { loadingSourceFunds: true } });
    expectComponentToBeLoader();

    component.setProps({
      loadingUser: false,
      exchange: {
        loadingSourceFunds: false,
        loadingTargetFunds: true,
        sourceSelection: [],
      },
    });
    expectComponentToBeLoader();

    component.setProps({
      loadingUser: false,
      exchange: {
        loadingSourceFunds: false,
        loadingTargetFunds: false,
        sourceSelection: [],
      },
    });
    expectComponentNotToBeLoader();
  });

  it('shows the intro to the mandate', () => {
    const user = {
      firstName: 'first',
      lastName: 'last',
      personalCode: '123456789',
    };
    component.setProps({ user });
    expect(component.contains([
      <Message>confirm.mandate.me</Message>,
      <b>{user.firstName} {user.lastName}</b>,
      <Message>confirm.mandate.idcode</Message>,
      <b>{user.personalCode}</b>,
      <Message>confirm.mandate.change.mandate</Message>,
    ])).toBe(true);
  });

  it('shows the future contribution fund if one is given', () => {
    const exchange = {
      selectedTargetFund: { isin: 'test isin' },
      sourceSelection: [],
      transferFutureCapital: true,
    };
    component.setProps({ exchange });
    expect(component.contains(
      <div className="mt-4">
        <Message>confirm.mandate.transfer.pension</Message>
        <b className="highlight">
          <Message>{`target.funds.${exchange.selectedTargetFund.isin}.title.into`}</Message>
        </b>.
      </div>,
    )).toBe(true);
    exchange.transferFutureCapital = false;
    component.setProps({ exchange });
    expect(component.contains(<Message>confirm.mandate.transfer.pension</Message>)).toBe(false);
  });

  it('has a link to the previous step', () => {
    expect(component.contains(
      <Link className="btn btn-secondary" to="/steps/transfer-future-capital">
        <Message>steps.previous</Message>
      </Link>,
    )).toBe(true);
  });

  it('renders a fund transfer mandate for every fund exchanged', () => {
    const sourceSelection = [
      { percentage: 0, sourceFundIsin: 'source 1', targetFundIsin: 'target 2' },
      { percentage: 0.5, sourceFundIsin: 'source 1', targetFundIsin: 'target 1' },
      { percentage: 1, sourceFundIsin: 'source 2', targetFundIsin: 'target 2' },
    ];
    const sourceFunds = [{ isin: 'source 1', name: 'a' }, { isin: 'source 2', name: 'b' }];
    component.setProps({ exchange: { sourceSelection, sourceFunds } });

    expect(component.contains(
      <FundTransferMandate selection={{ ...sourceSelection[1], sourceFundName: 'a' }} />,
    )).toBe(true);
    expect(component.contains(
      <FundTransferMandate selection={{ ...sourceSelection[2], sourceFundName: 'b' }} />,
    )).toBe(true);
    expect(component.contains(
      <FundTransferMandate selection={{ ...sourceSelection[0], sourceFundName: 'a' }} />,
    )).toBe(false); // first is 0 percent, so should not be rendered
  });

  it('renders an overlayed authentication loader when you are signing the mandate', () => {
    const onCancelSigningMandate = jest.fn();
    component.setProps({ onCancelSigningMandate });
    const hasAuthLoader = () => !!component.find(AuthenticationLoader).length;
    expect(hasAuthLoader()).toBe(false);
    component.setProps({
      exchange: { mandateSigningControlCode: null, sourceSelection: [], loadingMandate: true },
    });
    expect(hasAuthLoader()).toBe(true);
  });

  it('renders the authentication loader with a control code', () => {
    component.setProps({ exchange: { sourceSelection: [], mandateSigningControlCode: '1337' } });
    expect(component.find(AuthenticationLoader).prop('controlCode')).toBe('1337');
  });

  it('can cancel signing the mandate', () => {
    const onCancelSigningMandate = jest.fn();
    component.setProps({
      exchange: { sourceSelection: [], mandateSigningControlCode: '1337' },
      onCancelSigningMandate,
    });
    expect(onCancelSigningMandate).not.toHaveBeenCalled();
    component.find(AuthenticationLoader).simulate('cancel');
    expect(onCancelSigningMandate).toHaveBeenCalledTimes(1);
  });

  it('can start signing the mandate with a future capital fund', () => {
    const onSignMandate = jest.fn();
    const exchange = {
      sourceSelection: [
        { percentage: 0.5, sourceFundIsin: 'source 1', targetFundIsin: 'target 1' },
        { percentage: 1, sourceFundIsin: 'source 2', targetFundIsin: 'target 2' },
      ],
      sourceFunds: [{ isin: 'source 1', name: 'a' }, { isin: 'source 2', name: 'b' }],
      transferFutureCapital: true,
      selectedTargetFund: { isin: 'target 1' },
    };
    component.setProps({ onSignMandate, exchange });
    expect(onSignMandate).not.toHaveBeenCalled();
    component.find('button').simulate('click');
    expect(onSignMandate).toHaveBeenCalledTimes(1);
    expect(onSignMandate).toHaveBeenCalledWith({
      fundTransferExchanges: [
        { amount: 0.5, sourceFundIsin: 'source 1', targetFundIsin: 'target 1' },
        { amount: 1, sourceFundIsin: 'source 2', targetFundIsin: 'target 2' },
      ],
      futureContributionFundIsin: 'target 1',
    });
  });

  it('aggregates selections for showing funds', () => {
    const exchange = {
      sourceSelection: [
        // these two are joined
        { percentage: 0.1, sourceFundIsin: 'source 1', targetFundIsin: 'target 1' },
        { percentage: 1, sourceFundIsin: 'source 1', targetFundIsin: 'target 1' },

        // these are joined
        { percentage: 0.2, sourceFundIsin: 'source 2', targetFundIsin: 'target 2' },
        { percentage: 0.3, sourceFundIsin: 'source 2', targetFundIsin: 'target 2' },
        { percentage: 0.4, sourceFundIsin: 'source 2', targetFundIsin: 'target 2' },

        // separate
        { percentage: 0.4, sourceFundIsin: 'source 1', targetFundIsin: 'target 2' },
      ],
      sourceFunds: [{ isin: 'source 1', name: 'a' }, { isin: 'source 2', name: 'b' }],
    };
    component.setProps({ exchange });
    const firstExpectedSelection = {
      sourceFundName: 'a',
      percentage: 1,
      sourceFundIsin: 'source 1',
      targetFundIsin: 'target 1',
    };
    const secondExpectedSelection = {
      sourceFundName: 'b',
      percentage: 0.9,
      sourceFundIsin: 'source 2',
      targetFundIsin: 'target 2',
    };
    const thirdExpectedSelection = {
      sourceFundName: 'a',
      percentage: 0.4,
      sourceFundIsin: 'source 1',
      targetFundIsin: 'target 2',
    };
    [firstExpectedSelection, secondExpectedSelection, thirdExpectedSelection]
      .forEach(selection =>
        expect(component.contains(<FundTransferMandate selection={selection} />)).toBe(true));
  });


  it('can start signing the mandate with a future capital fund', () => {
    const onSignMandate = jest.fn();
    const exchange = {
      sourceSelection: [
        { percentage: 0.5, sourceFundIsin: 'source 1', targetFundIsin: 'target 1' },
        { percentage: 1, sourceFundIsin: 'source 2', targetFundIsin: 'target 2' },
      ],
      sourceFunds: [{ isin: 'source 1', name: 'a' }, { isin: 'source 2', name: 'b' }],
      transferFutureCapital: false,
      selectedTargetFund: null,
    };
    component.setProps({ onSignMandate, exchange });
    expect(onSignMandate).not.toHaveBeenCalled();
    component.find('button').simulate('click');
    expect(onSignMandate).toHaveBeenCalledTimes(1);
    expect(onSignMandate).toHaveBeenCalledWith({
      fundTransferExchanges: [
        { amount: 0.5, sourceFundIsin: 'source 1', targetFundIsin: 'target 1' },
        { amount: 1, sourceFundIsin: 'source 2', targetFundIsin: 'target 2' },
      ],
      futureContributionFundIsin: null,
    });
  });
});
