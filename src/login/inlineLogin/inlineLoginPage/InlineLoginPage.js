/* eslint-disable no-confusing-arrow,no-useless-escape */
import React, { Component, PropTypes as Types } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message, withTranslations } from 'retranslate';

import './InlineLoginPage.scss';

import { AuthenticationLoader, ErrorAlert } from '../../../common';
import LoginForm from '../inlineLoginForm';
import {
  changePhoneNumber,
  changeEmail,
  useRedirectLoginWithPhoneNumber,
  cancelMobileAuthentication,
  useRedirectLoginWithIdCard,
} from '../../actions';

const isEmailValid = value => /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()\.,;\s@\"]+\.{0,1})+[^<>()\.,;:\s@\"]{2,})$/.test(value);

export class InlineLoginPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ctaClicked: false,
      email: null,
    };
  }

  onCtaClick() {
    this.props.onEmailChange(this.state.email);
    this.setState(() => ({ ctaClicked: true }));
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
      translations: { translate },
    } = this.props;

    return (
      <div className="row mt-4 pt-4 pb-4 justify-content-center login-form">
        <div className="col-lg-10 offset-lg-1 col-sm-12 offset-sm-0 text-center">
          <form>
            <div>
              <div className="form-group">
                <input
                  id="email"
                  type="email"
                  onChange={(event) => {
                    event.persist();
                    this.setState(() => ({ email: event.target.value }));
                  }}
                  className="form-control form-control-lg"
                  placeholder={translate('inline.login.email')}
                />
              </div>
            </div>
          </form>
        </div>
        <div className="col-lg-10 offset-lg-1 col-sm-12 offset-sm-0 text-center">
          {
            this.state.ctaClicked ? (
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
                <div className="mt-3 small mb-3">
                  <a href="/terms-of-use" target="_blank" rel="noopener noreferrer">
                    <Message>login.terms.link</Message>
                  </a>
                </div>
              </div>
            ) : (
              <div className="container pt-5">
                <div className="row">
                  <div className="col-lg-12 text-center">
                    <button
                      className="btn btn-primary btn-block btn-lg"
                      onClick={() => this.onCtaClick()}
                      disabled={!isEmailValid(this.state.email)}
                    >
                      <Message>inline.login.cta</Message>
                    </button>
                  </div>
                </div>
              </div>
            )
          }
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
  onEmailChange: noop,

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
  onEmailChange: Types.func,

  phoneNumber: Types.string,
  controlCode: Types.string,
  loadingAuthentication: Types.bool,
  errorDescription: Types.string,
  translations: Types.shape({ translate: Types.func.isRequired }).isRequired,
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
  onEmailChange: changeEmail,
  onPhoneNumberSubmit: useRedirectLoginWithPhoneNumber,
  onCancelMobileAuthentication: cancelMobileAuthentication,
  onAuthenticateWithIdCard: useRedirectLoginWithIdCard,
}, dispatch);

const withRedux = connect(mapStateToProps, mapDispatchToProps);

export default withTranslations(withRedux(InlineLoginPage));
