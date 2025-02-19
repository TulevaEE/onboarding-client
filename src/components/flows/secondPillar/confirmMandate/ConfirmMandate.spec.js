import React from 'react';
import { shallow } from 'enzyme';

import { Link, Redirect } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { ConfirmMandate } from './ConfirmMandate';
import { FundTransferTable } from './fundTransferTable/FundTransferTable';
import MandateNotFilledAlert from './mandateNotFilledAlert';
import { Loader, AuthenticationLoader, ErrorMessage } from '../../../common';

describe('Confirm mandate step', () => {
  let component;

  beforeEach(() => {
    component = shallow(
      <ConfirmMandate
        exchange={{
          loadingSourceFunds: false,
          loadingTargetFunds: false,
          sourceSelection: [],
          selectedFutureContributionsFundIsin: null,
          agreedToTerms: false,
        }}
      />,
    );
  });

  it('redirects to previous path only when no address', () => {
    component.setProps({
      previousPath: '/a-path',
      exchange: {
        sourceSelection: [],
      },
      selectedFutureContributionsFund: { isin: 'EE123' },
    });
    const redirects = () => component.contains(<Redirect to="/a-path" />);

    expect(redirects()).toBe(true);
    component.setProps({ hasAddress: true });
    expect(redirects()).toBe(false);
  });

  it('renders a loader if it is loading the user or funds', () => {
    const expectComponentToBeLoader = () =>
      expect(component.at(0).getElement(0)).toEqual(<Loader className="align-middle" />);
    const expectComponentNotToBeLoader = () =>
      expect(component.at(0).getElement(0)).not.toEqual(<Loader className="align-middle" />);

    component.setProps({ loading: true });
    expectComponentToBeLoader();

    component.setProps({ loading: false });
    expectComponentNotToBeLoader();
  });

  it('shows the intro to the mandate', () => {
    const exchange = {
      sourceSelection: [],
    };
    component.setProps({ exchange, selectedFutureContributionsFund: { isin: 'EE123' } });
    expect(component.contains(<FormattedMessage id="confirm.mandate.intro" />)).toBe(true);
  });

  it('shows the future contribution fund if one is given', () => {
    const exchange = {
      selectedFutureContributionsFundIsin: 'test isin',
      sourceSelection: [],
    };
    const selectedFutureContributionsFund = { name: 'test name' };
    component.setProps({ exchange, selectedFutureContributionsFund });
    expect(component.contains('test name')).toBe(true);
    exchange.selectedFutureContributionsFundIsin = null;
    component.setProps({ exchange, selectedFutureContributionsFund: null });
    expect(component.contains(<FormattedMessage id="confirm.mandate.future.contribution" />)).toBe(
      false,
    );
  });

  it('has a back button', () => {
    const onPreviousStep = jest.fn();
    component.setProps({
      exchange: {
        sourceSelection: [],
        selectedFutureContributionsFundIsin: 'asd',
      },
      selectedFutureContributionsFund: { isin: 'asd' },
      onPreviousStep,
    });
    expect(
      component.contains(
        <Link className="btn btn-outline-primary" to="/2nd-pillar-flow/select-sources">
          <FormattedMessage id="confirm.mandate.back" />
        </Link>,
      ),
    ).toBe(true);
  });

  it('does not show the funds table if you are not transferring funds', () => {
    const sourceSelection = [
      { percentage: 0, sourceFundIsin: 'source 1', targetFundIsin: 'target 2' },
    ];
    const sourceFunds = [{ isin: 'source 1', name: 'a' }];
    component.setProps({ exchange: { sourceSelection, sourceFunds } });
    expect(component.contains(<FormattedMessage id="confirm.mandate.switch.sources" />)).toBe(
      false,
    );
    expect(!!component.find(FundTransferTable).length).toBe(false);
  });

  it('shows the funds you are transferring', () => {
    const sourceSelection = [
      {
        percentage: 0.5,
        sourceFundIsin: 'source 1',
        targetFundIsin: 'target 1',
      },
      { percentage: 1, sourceFundIsin: 'source 2', targetFundIsin: 'target 2' },
    ];
    const sourceFunds = [
      { isin: 'source 1', name: 'a' },
      { isin: 'source 2', name: 'b' },
    ];
    const targetFunds = [
      { isin: 'target 1', name: 'c' },
      { isin: 'target 2', name: 'd' },
    ];
    component.setProps({
      exchange: { sourceSelection, sourceFunds, targetFunds },
    });
    expect(component.find(FundTransferTable).prop('selections')).toEqual([
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
    ]);
  });

  it('aggregates selections for showing funds', () => {
    const exchange = {
      sourceSelection: [
        // these two are joined
        {
          percentage: 0.1,
          sourceFundIsin: 'source 1',
          targetFundIsin: 'target 1',
        },
        {
          percentage: 1,
          sourceFundIsin: 'source 1',
          targetFundIsin: 'target 1',
        },

        // these are joined
        {
          percentage: 0.2,
          sourceFundIsin: 'source 2',
          targetFundIsin: 'target 2',
        },
        {
          percentage: 0.3,
          sourceFundIsin: 'source 2',
          targetFundIsin: 'target 2',
        },
        {
          percentage: 0.4,
          sourceFundIsin: 'source 2',
          targetFundIsin: 'target 2',
        },

        // separate
        {
          percentage: 0.4,
          sourceFundIsin: 'source 1',
          targetFundIsin: 'target 2',
        },
      ],
      sourceFunds: [
        { isin: 'source 1', name: 'a' },
        { isin: 'source 2', name: 'b' },
      ],
      targetFunds: [
        { isin: 'target 1', name: 'c' },
        { isin: 'target 2', name: 'd' },
      ],
    };
    component.setProps({ exchange });
    expect(component.find(FundTransferTable).prop('selections')).toEqual([
      {
        percentage: 1,
        sourceFundIsin: 'source 1',
        targetFundIsin: 'target 1',
        sourceFundName: 'a',
        targetFundName: 'c',
      },
      {
        percentage: 0.4,
        sourceFundIsin: 'source 1',
        targetFundIsin: 'target 2',
        sourceFundName: 'a',
        targetFundName: 'd',
      },
      {
        percentage: 0.9,
        sourceFundIsin: 'source 2',
        targetFundIsin: 'target 2',
        sourceFundName: 'b',
        targetFundName: 'd',
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
      selectedFutureContributionsFund: { isin: 'asd' },
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
      selectedFutureContributionsFund: { isin: 'asd' },
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
      selectedFutureContributionsFund: { isin: 'asd' },
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
          {
            percentage: 0.1,
            sourceFundIsin: 'source 1',
            targetFundIsin: 'target 1',
          },
        ],
        sourceFunds: [{ isin: 'source 1', name: 'a' }],
        targetFunds: [{ isin: 'target 1', name: 'c' }],
        selectedFutureContributionsFundIsin: 'asd',
      },
    });
    expect(
      component.contains(
        <label className="form-check-label" htmlFor="agree-to-terms-checkbox">
          <FormattedMessage id="confirm.mandate.agree.to.terms" />
          <div className="mt-2">
            <small className="text-body-secondary">
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="//www.pensionikeskus.ee/ii-sammas/kohustuslikud-pensionifondid/fonditasude-vordlus/"
              >
                <FormattedMessage id="confirm.mandate.pension.centre" />
              </a>
              <FormattedMessage id="confirm.mandate.view.info" />
            </small>
          </div>
        </label>,
      ),
    ).toEqual(true);
  });

  it('can preview mandate', () => {
    const onPreviewMandate = jest.fn();
    const exchange = {
      sourceSelection: [
        {
          percentage: 0.5,
          sourceFundIsin: 'source 1',
          targetFundIsin: 'target 1',
        },
        {
          percentage: 1,
          sourceFundIsin: 'source 2',
          targetFundIsin: 'target 2',
        },
        {
          percentage: 1,
          sourceFundIsin: 'source 3',
          targetFundIsin: 'target 3',
        },
      ],
      sourceFunds: [
        { isin: 'source 1', name: 'a' },
        { isin: 'source 2', name: 'b' },
        { isin: 'source 3', name: 'c', price: 0 },
      ],
      targetFunds: [
        { isin: 'target 1', name: 'c' },
        { isin: 'target 2', name: 'd' },
        { isin: 'target 3', name: 'c' },
      ],
      selectedFutureContributionsFundIsin: 'target 1',
      agreedToTerms: true,
    };
    const address = { countryCode: 'EE' };
    component.setProps({
      onPreviewMandate,
      exchange,
      address,
      selectedFutureContributionsFund: { isin: 'target 1' },
    });
    expect(onPreviewMandate).not.toHaveBeenCalled();
    component.find('button#preview').simulate('click');
    expect(onPreviewMandate).toHaveBeenCalledTimes(1);
    expect(onPreviewMandate).toHaveBeenCalledWith({
      fundTransferExchanges: [
        { amount: 0.5, sourceFundIsin: 'source 1', targetFundIsin: 'target 1' },
        { amount: 1, sourceFundIsin: 'source 2', targetFundIsin: 'target 2' },
      ],
      futureContributionFundIsin: 'target 1',
      address,
    });
  });

  it('can start signing the mandate with a future contribution fund', () => {
    const onSignMandate = jest.fn();
    const exchange = {
      sourceSelection: [
        {
          percentage: 0.5,
          sourceFundIsin: 'source 1',
          targetFundIsin: 'target 1',
        },
        {
          percentage: 1,
          sourceFundIsin: 'source 2',
          targetFundIsin: 'target 2',
        },
        {
          percentage: 1,
          sourceFundIsin: 'source 3',
          targetFundIsin: 'target 3',
        },
      ],
      sourceFunds: [
        { isin: 'source 1', name: 'a' },
        { isin: 'source 2', name: 'b' },
        { isin: 'source 3', name: 'c', price: 0 },
      ],
      targetFunds: [
        { isin: 'target 1', name: 'c' },
        { isin: 'target 2', name: 'd' },
        { isin: 'target 3', name: 'c' },
      ],
      selectedFutureContributionsFundIsin: 'target 1',
      agreedToTerms: true,
    };
    const address = { countryCode: 'EE' };
    component.setProps({
      onSignMandate,
      exchange,
      address,
      selectedFutureContributionsFund: { isin: 'target 1' },
    });
    expect(onSignMandate).not.toHaveBeenCalled();
    component.find('button#sign').simulate('click');
    expect(onSignMandate).toHaveBeenCalledTimes(1);
    expect(onSignMandate).toHaveBeenCalledWith({
      fundTransferExchanges: [
        { amount: 0.5, sourceFundIsin: 'source 1', targetFundIsin: 'target 1' },
        { amount: 1, sourceFundIsin: 'source 2', targetFundIsin: 'target 2' },
      ],
      futureContributionFundIsin: 'target 1',
      address,
    });
  });

  it('can start signing the mandate without a future contribution fund', () => {
    const onSignMandate = jest.fn();
    const exchange = {
      sourceSelection: [
        {
          percentage: 0.5,
          sourceFundIsin: 'source 1',
          targetFundIsin: 'target 1',
        },
        {
          percentage: 1,
          sourceFundIsin: 'source 2',
          targetFundIsin: 'target 2',
        },
      ],
      sourceFunds: [
        { isin: 'source 1', name: 'a' },
        { isin: 'source 2', name: 'b' },
      ],
      targetFunds: [
        { isin: 'target 1', name: 'c' },
        { isin: 'target 2', name: 'd' },
      ],
      selectedFutureContributionsFundIsin: null,
      agreedToTerms: true,
    };
    const address = { countryCode: 'EE' };
    component.setProps({
      onSignMandate,
      exchange,
      address,
      selectedFutureContributionsFund: { isin: null },
    });
    expect(onSignMandate).not.toHaveBeenCalled();
    component.find('button#sign').simulate('click');
    expect(onSignMandate).toHaveBeenCalledTimes(1);
    expect(onSignMandate).toHaveBeenCalledWith({
      fundTransferExchanges: [
        { amount: 0.5, sourceFundIsin: 'source 1', targetFundIsin: 'target 1' },
        { amount: 1, sourceFundIsin: 'source 2', targetFundIsin: 'target 2' },
      ],
      futureContributionFundIsin: null,
      address,
    });
  });

  it('keeps an input for agreeing to terms', () => {
    const exchange = {
      sourceSelection: [
        {
          percentage: 0.5,
          sourceFundIsin: 'source 1',
          targetFundIsin: 'target 1',
        },
        {
          percentage: 1,
          sourceFundIsin: 'source 2',
          targetFundIsin: 'target 2',
        },
      ],
      sourceFunds: [
        { isin: 'source 1', name: 'a' },
        { isin: 'source 2', name: 'b' },
      ],
      targetFunds: [
        { isin: 'target 1', name: 'c' },
        { isin: 'target 2', name: 'd' },
      ],
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
        {
          percentage: 0.5,
          sourceFundIsin: 'source 1',
          targetFundIsin: 'target 1',
        },
        {
          percentage: 1,
          sourceFundIsin: 'source 2',
          targetFundIsin: 'target 2',
        },
      ],
      sourceFunds: [
        { isin: 'source 1', name: 'a' },
        { isin: 'source 2', name: 'b' },
      ],
      targetFunds: [
        { isin: 'target 1', name: 'c' },
        { isin: 'target 2', name: 'd' },
      ],
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
        {
          percentage: 0.5,
          sourceFundIsin: 'source 1',
          targetFundIsin: 'target 1',
        },
        {
          percentage: 1,
          sourceFundIsin: 'source 2',
          targetFundIsin: 'target 2',
        },
      ],
      sourceFunds: [
        { isin: 'source 1', name: 'a' },
        { isin: 'source 2', name: 'b' },
      ],
      targetFunds: [
        { isin: 'target 1', name: 'c' },
        { isin: 'target 2', name: 'd' },
      ],
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
        {
          percentage: 0.5,
          sourceFundIsin: 'source 1',
          targetFundIsin: 'target 1',
        },
        {
          percentage: 1,
          sourceFundIsin: 'source 2',
          targetFundIsin: 'target 2',
        },
      ],
      sourceFunds: [
        { isin: 'source 1', name: 'a' },
        { isin: 'source 2', name: 'b' },
      ],
      targetFunds: [
        { isin: 'target 1', name: 'c' },
        { isin: 'target 2', name: 'd' },
      ],
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
        {
          percentage: 0,
          sourceFundIsin: 'source 1',
          targetFundIsin: 'target 1',
        },
        {
          percentage: 0,
          sourceFundIsin: 'source 2',
          targetFundIsin: 'target 2',
        },
      ],
      sourceFunds: [
        { isin: 'source 1', name: 'a' },
        { isin: 'source 2', name: 'b' },
      ],
      targetFunds: [
        { isin: 'target 1', name: 'c' },
        { isin: 'target 2', name: 'd' },
      ],
      selectedFutureContributionsFundIsin: null,
      agreedToTerms: false,
    };
    component.setProps({ exchange });
    expect(component.at(0).getElement(0)).toEqual(<MandateNotFilledAlert />);
    expect(component.find('button').length === 0).toBe(true);
  });

  it('shows error message on error', () => {
    const error = 'oh no!';
    const onCloseErrorMessages = jest.fn();
    const exchange = {
      sourceSelection: [
        {
          percentage: 0,
          sourceFundIsin: 'source 1',
          targetFundIsin: 'target 1',
        },
        {
          percentage: 0,
          sourceFundIsin: 'source 2',
          targetFundIsin: 'target 2',
        },
      ],
      sourceFunds: [
        { isin: 'source 1', name: 'a' },
        { isin: 'source 2', name: 'b' },
      ],
      targetFunds: [
        { isin: 'target 1', name: 'c' },
        { isin: 'target 2', name: 'd' },
      ],
      selectedFutureContributionsFundIsin: null,
      error,
    };
    component.setProps({ exchange, onCloseErrorMessages });
    expect(component.at(0).getElement(0)).toEqual(
      <ErrorMessage errors={exchange.error.body} onCancel={onCloseErrorMessages} overlayed />,
    );
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
      selectedFutureContributionsFund: { isin: 'test isin' },
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
