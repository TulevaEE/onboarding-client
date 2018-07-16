/* eslint-disable no-confusing-arrow,no-useless-escape */
import React, { Component } from 'react';
import { PropTypes as Types } from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message, withTranslations } from 'retranslate';
import FacebookProvider, { Like } from 'react-facebook';

import './InlineLoginPage.scss';

import { AuthenticationLoader, ErrorAlert } from '../../../common';
import LoginForm from '../inlineLoginForm';
import {
  changePhoneNumber,
  useRedirectLoginWithPhoneNumber,
  cancelMobileAuthentication,
  useRedirectLoginWithIdCard,
} from '../../actions';

export class InlineLoginPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    const {
      onPhoneNumberSubmit,
      onPhoneNumberChange,
      onCancelMobileAuthentication,
      onAuthenticateWithIdCard,
      phoneNumber,
      controlCode,
      loadingAuthentication,
      errorDescription,
    } = this.props;

    return (
      <div>
        <div className="row form-group">
          <div>
            { errorDescription ? <ErrorAlert description={errorDescription} /> : '' }
            {
              !loadingAuthentication && !controlCode ?
                <LoginForm
                  onPhoneNumberSubmit={onPhoneNumberSubmit}
                  onPhoneNumberChange={onPhoneNumberChange}
                  phoneNumber={phoneNumber}
                  onAuthenticateWithIdCard={onAuthenticateWithIdCard}
                /> : ''
            }
            {
              !errorDescription && (loadingAuthentication || controlCode) ?
                <AuthenticationLoader
                  onCancel={onCancelMobileAuthentication}
                  controlCode={controlCode}
                /> : ''
            }
            <div className="mt-3 small mb-3 text-center">
              <a href="/terms-of-use" target="_blank" rel="noopener noreferrer">
                <Message>login.terms.link</Message>
              </a>
            </div>
          </div>
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
  onAuthenticateWithIdCard: noop,

  phoneNumber: '',
  controlCode: '',
  loadingAuthentication: false,
  successful: false,
  errorDescription: '',
};

InlineLoginPage.propTypes = {
  onPhoneNumberChange: Types.func,
  onPhoneNumberSubmit: Types.func,
  onCancelMobileAuthentication: Types.func,
  onAuthenticateWithIdCard: Types.func,

  phoneNumber: Types.string,
  controlCode: Types.string,
  loadingAuthentication: Types.bool,
  errorDescription: Types.string,
};

const mapStateToProps = state => ({
  phoneNumber: state.login.phoneNumber,
  controlCode: state.login.controlCode,
  loadingAuthentication: state.login.loadingAuthentication,
  errorDescription: state.login.error,
  successful: !!state.login.token, // not used right now
});
const mapDispatchToProps = dispatch => bindActionCreators({
  onPhoneNumberChange: changePhoneNumber,
  onPhoneNumberSubmit: useRedirectLoginWithPhoneNumber,
  onCancelMobileAuthentication: cancelMobileAuthentication,
  onAuthenticateWithIdCard: useRedirectLoginWithIdCard,
}, dispatch);

const withRedux = connect(mapStateToProps, mapDispatchToProps);

export default withTranslations(withRedux(InlineLoginPage));
