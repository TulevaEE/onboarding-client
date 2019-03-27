/* eslint-disable no-confusing-arrow,no-useless-escape */
import React, { Component } from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message, withTranslations } from 'retranslate';
import FacebookProvider, { Like } from 'react-facebook';

import './InlineLoginPage.css';

import { AuthenticationLoader, ErrorAlert } from '../../../common';
import LoginForm from '../inlineLoginForm';
import {
  changePhoneNumber,
  useRedirectLoginWithPhoneNumber,
  cancelMobileAuthentication,
  useRedirectLoginWithIdCard,
  changeIdCode,
  useRedirectLoginWithIdCode,
} from '../../actions';

export class InlineLoginPage extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const {
      onPhoneNumberSubmit,
      onPhoneNumberChange,
      onCancelMobileAuthentication,
      onIdCodeChange,
      onIdCodeSubmit,
      onAuthenticateWithIdCard,
      phoneNumber,
      identityCode,
      controlCode,
      loadingAuthentication,
      loadingUserConversion,
      errorDescription,
    } = this.props;

    return (
      <div>
        {errorDescription ? <ErrorAlert description={errorDescription} /> : ''}
        {!loadingAuthentication && !controlCode && !loadingUserConversion ? (
          <LoginForm
            onPhoneNumberSubmit={onPhoneNumberSubmit}
            onPhoneNumberChange={onPhoneNumberChange}
            phoneNumber={phoneNumber}
            onIdCodeSubmit={onIdCodeSubmit}
            onIdCodeChange={onIdCodeChange}
            identityCode={identityCode}
            onAuthenticateWithIdCard={onAuthenticateWithIdCard}
          />
        ) : (
          ''
        )}
        {!errorDescription && (loadingAuthentication || controlCode || loadingUserConversion) ? (
          <AuthenticationLoader onCancel={onCancelMobileAuthentication} controlCode={controlCode} />
        ) : (
          ''
        )}
        <div className="mt-3 small mb-3 text-center">
          <a href="/terms-of-use" target="_blank" rel="noopener noreferrer">
            <Message>login.terms.link</Message>
          </a>
        </div>
        <div className="row mt-3">
          <div className="col-lg-12 text-center">
            <FacebookProvider appId="1939240566313354">
              <Like href="http://www.facebook.com/Tuleva.ee" colorScheme="dark" showFaces />
            </FacebookProvider>
          </div>
        </div>
      </div>
    );
  }
}
const noop = () => null;

InlineLoginPage.defaultProps = {
  onPhoneNumberChange: noop,
  onPhoneNumberSubmit: noop,
  onCancelMobileAuthentication: noop,
  onIdCodeChange: noop,
  onIdCodeSubmit: noop,
  onAuthenticateWithIdCard: noop,

  phoneNumber: '',
  identityCode: '',
  controlCode: '',
  loadingAuthentication: false,
  loadingUserConversion: false,
  successful: false,
  errorDescription: '',
};

InlineLoginPage.propTypes = {
  onPhoneNumberChange: Types.func,
  onPhoneNumberSubmit: Types.func,
  onCancelMobileAuthentication: Types.func,
  onIdCodeChange: Types.func,
  onIdCodeSubmit: Types.func,
  onAuthenticateWithIdCard: Types.func,

  phoneNumber: Types.string,
  identityCode: Types.string,
  controlCode: Types.string,
  loadingAuthentication: Types.bool,
  loadingUserConversion: Types.bool,
  errorDescription: Types.string,
};

const mapStateToProps = state => ({
  phoneNumber: state.login.phoneNumber,
  identityCode: state.login.identityCode,
  controlCode: state.login.controlCode,
  loadingAuthentication: state.login.loadingAuthentication,
  loadingUserConversion: state.login.loadingUserConversion,
  errorDescription: state.login.error || state.login.userConversionError,
  successful: !!state.login.token, // not used right now
});
const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onPhoneNumberChange: changePhoneNumber,
      onPhoneNumberSubmit: useRedirectLoginWithPhoneNumber,
      onCancelMobileAuthentication: cancelMobileAuthentication,
      onIdCodeChange: changeIdCode,
      onIdCodeSubmit: useRedirectLoginWithIdCode,
      onAuthenticateWithIdCard: useRedirectLoginWithIdCard,
    },
    dispatch,
  );

const withRedux = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default withTranslations(withRedux(InlineLoginPage));
