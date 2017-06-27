import React from 'react';
import { shallow } from 'enzyme';
import { Message } from 'retranslate';

import { ConfirmMandate, exitShortFlow } from './ConfirmMandate';
import FundTransferTable from './fundTransferTable';
import MandateNotFilledAlert from './mandateNotFilledAlert';
import { Loader, AuthenticationLoader, ErrorMessage } from '../../common';

import {
  disableShortFlow,
} from '../../exchange/actions';


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

    component.setProps({ exchange: { loadingSourceFunds: true } });
    expectComponentToBeLoader();

    component.setProps({
      exchange: {
        loadingSourceFunds: false,
        loadingTargetFunds: true,
        sourceSelection: [],
      },
    });
    expectComponentToBeLoader();

    component.setProps({
      exchange: {
        loadingSourceFunds: false,
        loadingTargetFunds: false,
        sourceSelection: [],
      },
    });
    expectComponentNotToBeLoader();
  });

  it('shows the intro to the mandate', () => {
    const exchange = {
      sourceSelection: [],
      selectedFutureContributionsFundIsin: 'asd',
    };
    component.setProps({ exchange });
    expect(component.contains(<Message>confirm.mandate.intro</Message>)).toBe(true);
  });

  it('shows the future contribution fund if one is given', () => {
    const exchange = {
      selectedFutureContributionsFundIsin: 'test isin',
      sourceSelection: [],
    };
    component.setProps({ exchange });
    expect(component.contains(
      <div className="mt-4">
        <Message>confirm.mandate.future.contribution</Message>
        <b className="highlight">
          <Message>{`target.funds.${exchange.selectedFutureContributionsFundIsin}.title.into`}</Message>
        </b>
        {''}
      </div>,
    )).toBe(true);
    exchange.selectedFutureContributionsFundIsin = null;
    component.setProps({ exchange });
    expect(component.contains(<Message>confirm.mandate.future.contribution</Message>)).toBe(false);
  });

  it('shows "and" between the two mandate parts if there are source selections', () => {
    const exchange = {
      selectedFutureContributionsFundIsin: 'test isin',
      sourceSelection: [
        { sourceFundIsin: 'a', targetFundIsin: 'b', percentage: 1 },
      ],
      sourceFunds: [{ isin: 'a', name: 'source' }],
      targetFunds: [{ isin: 'b', name: 'target' }],
    };
    component.setProps({ exchange });
    expect(component.contains(
      <div className="mt-4">
        <Message>confirm.mandate.future.contribution</Message>
        <b className="highlight">
          <Message>{`target.funds.${exchange.selectedFutureContributionsFundIsin}.title.into`}</Message>
        </b>
        <Message>confirm.mandate.and</Message>
      </div>,
    )).toBe(true);
    exchange.selectedFutureContributionsFundIsin = null;
    component.setProps({ exchange });
    expect(component.contains(<Message>confirm.mandate.future.contribution</Message>)).toBe(false);
  });

  it('has a button to the previous step', () => {
    const onPreviousStep = jest.fn();
    component.setProps({
      exchange: {
        sourceSelection: [],
        selectedFutureContributionsFundIsin: 'asd',
      },
      onPreviousStep,
    });
    expect(component.contains(
      <button
        className="btn btn-secondary mb-2" onClick={onPreviousStep}
      >
        <Message>steps.previous</Message>
      </button>)).toBe(true);
  });

  it('has a button to exit the short flow', () => {
    const onExitShortFlow = jest.fn();
    component.setProps({
      exchange: {
        sourceSelection: [],
        selectedFutureContributionsFundIsin: 'asd',
      },
      onExitShortFlow,
      isShortFlowActive: true,
    });
    expect(component.contains(
      <button
        className="btn btn-secondary mb-2" onClick={onExitShortFlow}
      >
        <Message>confirm.mandate.exit.short.flow</Message>
      </button>)).toBe(true);
  });

  it('can exit the short flow', () => {
    const dispatch = jest.fn();
    exitShortFlow()(dispatch);
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenCalledWith(disableShortFlow());
  });

  it('does not show the funds table if you are not transferring funds', () => {
    const sourceSelection = [
      { percentage: 0, sourceFundIsin: 'source 1', targetFundIsin: 'target 2' },
    ];
    component.setProps({ exchange: { sourceSelection } });
    expect(component.contains(<Message>confirm.mandate.switch.sources</Message>)).toBe(false);
    expect(!!component.find(FundTransferTable).length).toBe(false);
  });

  it('shows the funds you are transferring', () => {
    const sourceSelection = [

      { percentage: 0.5, sourceFundIsin: 'source 1', targetFundIsin: 'target 1' },
      { percentage: 1, sourceFundIsin: 'source 2', targetFundIsin: 'target 2' },
    ];
    const sourceFunds = [{ isin: 'source 1', name: 'a' }, { isin: 'source 2', name: 'b' }];
    component.setProps({ exchange: { sourceSelection, sourceFunds } });
    expect(component.find(FundTransferTable).prop('selections')).toEqual([
      {
        percentage: 0.5,
        sourceFundIsin: 'source 1',
        targetFundIsin: 'target 1',
        sourceFundName: 'a',
      },
      {
        percentage: 1,
        sourceFundIsin: 'source 2',
        targetFundIsin: 'target 2',
        sourceFundName: 'b',
      },
    ]);
    expect(component.contains(<Message>confirm.mandate.switch.sources</Message>)).toBe(true);
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
    expect(component.find(FundTransferTable).prop('selections')).toEqual([
      {
        percentage: 1,
        sourceFundIsin: 'source 1',
        targetFundIsin: 'target 1',
        sourceFundName: 'a',
      },
      {
        percentage: 0.4,
        sourceFundIsin: 'source 1',
        targetFundIsin: 'target 2',
        sourceFundName: 'a',
      },
      {
        percentage: 0.9,
        sourceFundIsin: 'source 2',
        targetFundIsin: 'target 2',
        sourceFundName: 'b',
      },
    ]);
  });

  it('renders an overlayed authentication loader when you are signing the mandate', () => {
    const onCancelSigningMandate = jest.fn();
    component.setProps({
      onCancelSigningMandate,
      exchange: {
        sourceSelection: [],
        selectedFutureContributionsFundIsin: 'asd',
      },
    });
    const hasAuthLoader = () => !!component.find(AuthenticationLoader).length;
    expect(hasAuthLoader()).toBe(false);
    component.setProps({
      exchange: {
        mandateSigningControlCode: null,
        sourceSelection: [],
        loadingMandate: true,
        selectedFutureContributionsFundIsin: 'asd',
      },
    });
    expect(hasAuthLoader()).toBe(true);
  });

  it('renders the authentication loader with a control code', () => {
    component.setProps({
      exchange: {
        sourceSelection: [],
        mandateSigningControlCode: '1337',
        selectedFutureContributionsFundIsin: 'asd',
      },
    });
    expect(component.find(AuthenticationLoader).prop('controlCode')).toBe('1337');
  });

  it('can cancel signing the mandate', () => {
    const onCancelSigningMandate = jest.fn();
    component.setProps({
      exchange: {
        sourceSelection: [],
        mandateSigningControlCode: '1337',
        selectedFutureContributionsFundIsin: 'asd',
      },
      onCancelSigningMandate,
    });
    expect(onCancelSigningMandate).not.toHaveBeenCalled();
    component.find(AuthenticationLoader).simulate('cancel');
    expect(onCancelSigningMandate).toHaveBeenCalledTimes(1);
  });

  it('shows what the user is agreeing to', () => {
    component.setProps({
      exchange: {
        sourceSelection: [
          { percentage: 0.1, sourceFundIsin: 'source 1', targetFundIsin: 'target 1' },
        ],
        sourceFunds: [{ isin: 'source 1', name: 'a' }],
        selectedFutureContributionsFundIsin: 'asd',
      },
    });
    expect(component.contains(
      <div className="custom-control-description">
        <Message>confirm.mandate.agree.to.terms</Message>
        <div className="mt-2">
          <small className="text-muted">
            <a
              target="_blank" rel="noopener noreferrer"
              href="//www.pensionikeskus.ee/ii-sammas/fondid/fonditasude-vordlused/"
            >
              <Message>confirm.mandate.pension.centre</Message>
            </a>
            <Message>confirm.mandate.view.info</Message>
          </small>
        </div>
      </div>,
    )).toBe(true);
  });

  it('can preview mandate', () => {
    const onPreviewMandate = jest.fn();
    const exchange = {
      sourceSelection: [
        { percentage: 0.5, sourceFundIsin: 'source 1', targetFundIsin: 'target 1' },
        { percentage: 1, sourceFundIsin: 'source 2', targetFundIsin: 'target 2' },
        { percentage: 1, sourceFundIsin: 'source 3', targetFundIsin: 'target 3' },
      ],
      sourceFunds: [{ isin: 'source 1', name: 'a' }, { isin: 'source 2', name: 'b' }, { isin: 'source 3', name: 'c', price: 0 }],
      selectedFutureContributionsFundIsin: 'target 1',
      agreedToTerms: true,
    };
    component.setProps({ onPreviewMandate, exchange });
    expect(onPreviewMandate).not.toHaveBeenCalled();
    component.find('button#preview').simulate('click');
    expect(onPreviewMandate).toHaveBeenCalledTimes(1);
    expect(onPreviewMandate).toHaveBeenCalledWith({
      fundTransferExchanges: [
        { amount: 0.5, sourceFundIsin: 'source 1', targetFundIsin: 'target 1' },
        { amount: 1, sourceFundIsin: 'source 2', targetFundIsin: 'target 2' },
      ],
      futureContributionFundIsin: 'target 1',
    });
  });

  it('can start signing the mandate with a future capital fund', () => {
    const onSignMandate = jest.fn();
    const exchange = {
      sourceSelection: [
        { percentage: 0.5, sourceFundIsin: 'source 1', targetFundIsin: 'target 1' },
        { percentage: 1, sourceFundIsin: 'source 2', targetFundIsin: 'target 2' },
        { percentage: 1, sourceFundIsin: 'source 3', targetFundIsin: 'target 3' },
      ],
      sourceFunds: [{ isin: 'source 1', name: 'a' }, { isin: 'source 2', name: 'b' }, { isin: 'source 3', name: 'c', price: 0 }],
      selectedFutureContributionsFundIsin: 'target 1',
      agreedToTerms: true,
    };
    component.setProps({ onSignMandate, exchange });
    expect(onSignMandate).not.toHaveBeenCalled();
    component.find('button#sign').simulate('click');
    expect(onSignMandate).toHaveBeenCalledTimes(1);
    expect(onSignMandate).toHaveBeenCalledWith({
      fundTransferExchanges: [
        { amount: 0.5, sourceFundIsin: 'source 1', targetFundIsin: 'target 1' },
        { amount: 1, sourceFundIsin: 'source 2', targetFundIsin: 'target 2' },
      ],
      futureContributionFundIsin: 'target 1',
    });
  });

  it('can start signing the mandate with a future capital fund', () => {
    const onSignMandate = jest.fn();
    const exchange = {
      sourceSelection: [
        { percentage: 0.5, sourceFundIsin: 'source 1', targetFundIsin: 'target 1' },
        { percentage: 1, sourceFundIsin: 'source 2', targetFundIsin: 'target 2' },
      ],
      sourceFunds: [{ isin: 'source 1', name: 'a' }, { isin: 'source 2', name: 'b' }],
      selectedFutureContributionsFundIsin: null,
      agreedToTerms: true,
    };
    component.setProps({ onSignMandate, exchange });
    expect(onSignMandate).not.toHaveBeenCalled();
    component.find('button#sign').simulate('click');
    expect(onSignMandate).toHaveBeenCalledTimes(1);
    expect(onSignMandate).toHaveBeenCalledWith({
      fundTransferExchanges: [
        { amount: 0.5, sourceFundIsin: 'source 1', targetFundIsin: 'target 1' },
        { amount: 1, sourceFundIsin: 'source 2', targetFundIsin: 'target 2' },
      ],
      futureContributionFundIsin: null,
    });
  });

  it('keeps an input for agreeing to terms', () => {
    const exchange = {
      sourceSelection: [
        { percentage: 0.5, sourceFundIsin: 'source 1', targetFundIsin: 'target 1' },
        { percentage: 1, sourceFundIsin: 'source 2', targetFundIsin: 'target 2' },
      ],
      sourceFunds: [{ isin: 'source 1', name: 'a' }, { isin: 'source 2', name: 'b' }],
      selectedFutureContributionsFundIsin: null,
      agreedToTerms: false,
    };
    component.setProps({ exchange });
    expect(component.find('#agree-to-terms-checkbox').prop('checked')).toBe(false);
    exchange.agreedToTerms = true;
    component.setProps({ exchange });
    expect(component.find('#agree-to-terms-checkbox').prop('checked')).toBe(true);
  });

  it('disables the signing button if user has not agreed to terms', () => {
    const exchange = {
      sourceSelection: [
        { percentage: 0.5, sourceFundIsin: 'source 1', targetFundIsin: 'target 1' },
        { percentage: 1, sourceFundIsin: 'source 2', targetFundIsin: 'target 2' },
      ],
      sourceFunds: [{ isin: 'source 1', name: 'a' }, { isin: 'source 2', name: 'b' }],
      selectedFutureContributionsFundIsin: null,
      agreedToTerms: false,
    };
    component.setProps({ exchange });
    expect(component.find('button#sign').prop('disabled')).toBe(true);
    exchange.agreedToTerms = true;
    component.setProps({ exchange });
    expect(component.find('button#sign').prop('disabled')).toBe(false);
  });

  it('can change if the user has agreed to terms', () => {
    const exchange = {
      sourceSelection: [
        { percentage: 0.5, sourceFundIsin: 'source 1', targetFundIsin: 'target 1' },
        { percentage: 1, sourceFundIsin: 'source 2', targetFundIsin: 'target 2' },
      ],
      sourceFunds: [{ isin: 'source 1', name: 'a' }, { isin: 'source 2', name: 'b' }],
      selectedFutureContributionsFundIsin: null,
      agreedToTerms: false,
    };
    const onChangeAgreementToTerms = jest.fn();
    component.setProps({ exchange, onChangeAgreementToTerms });
    expect(onChangeAgreementToTerms).not.toHaveBeenCalled();
    component.find('#agree-to-terms-checkbox').simulate('change');
    expect(onChangeAgreementToTerms).toHaveBeenCalledTimes(1);
    expect(onChangeAgreementToTerms).toHaveBeenCalledWith(true);
    exchange.agreedToTerms = true;
    component.setProps({ exchange });
    component.find('#agree-to-terms-checkbox').simulate('change');
    expect(onChangeAgreementToTerms).toHaveBeenCalledTimes(2);
    expect(onChangeAgreementToTerms).toHaveBeenLastCalledWith(false);
  });

  it('does not start signing if user has not agreed to terms', () => {
    const onSignMandate = jest.fn();
    const exchange = {
      sourceSelection: [
        { percentage: 0.5, sourceFundIsin: 'source 1', targetFundIsin: 'target 1' },
        { percentage: 1, sourceFundIsin: 'source 2', targetFundIsin: 'target 2' },
      ],
      sourceFunds: [{ isin: 'source 1', name: 'a' }, { isin: 'source 2', name: 'b' }],
      selectedFutureContributionsFundIsin: null,
      agreedToTerms: false,
    };
    component.setProps({ onSignMandate, exchange });
    component.find('button#sign').simulate('click');
    expect(onSignMandate).not.toHaveBeenCalled();
  });

  it('shows a mandate not filled alert instead of the mandate when mandate not filled', () => {
    const exchange = {
      sourceSelection: [
        { percentage: 0, sourceFundIsin: 'source 1', targetFundIsin: 'target 1' },
        { percentage: 0, sourceFundIsin: 'source 2', targetFundIsin: 'target 2' },
      ],
      sourceFunds: [{ isin: 'source 1', name: 'a' }, { isin: 'source 2', name: 'b' }],
      selectedFutureContributionsFundIsin: null,
      agreedToTerms: false,
    };
    component.setProps({ exchange });
    expect(component.at(0).node).toEqual(<MandateNotFilledAlert />);
    expect(component.find('button').length === 0).toBe(true);
  });

  it('renders an overlayed error messages on error while signing the mandate', () => {
    const onCloseErrorMessages = jest.fn();
    component.setProps({
      onCloseErrorMessages,
      exchange: {
        selectedFutureContributionsFundIsin: 'test isin',
        sourceSelection: [],
        mandateSigningError: null,
      },
    });
    const hasErrorMessage = () => !!component.find(ErrorMessage).length;

    expect(hasErrorMessage()).toBe(false);
    component.setProps({
      exchange: {
        selectedFutureContributionsFundIsin: 'test isin',
        sourceSelection: [],
        mandateSigningError: { errors: [] },
      },
    });
    expect(hasErrorMessage()).toBe(true);
  });
});
