import React, { Component, PropTypes as Types } from 'react';
import FacebookProvider, { Like } from 'react-facebook';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message } from 'retranslate';

import './InlineLoginPage.scss';

import { logo, AuthenticationLoader, ErrorAlert } from '../../../common';
import LoginForm from '../inlineLoginForm';
import { changePhoneNumber, authenticateWithPhoneNumber, cancelMobileAuthentication, authenticateWithIdCard } from '../../actions';

export class InlineLoginPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      ctaClicked: false,
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

    if (!this.state.ctaClicked) {
      return (
        <div className="container pt-5">
          <div className="row">
            <div className="col-lg-12 text-center">
              <button
                className="btn btn-primary btn-block btn-lg"
                onClick={() => this.setState(() => ({ ctaClicked: true }))}
              >
                <Message>inline.login.cta</Message>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="login-page">
        <div className="container pt-5">
          <div className="row">
            <div className="col-lg-12 text-center">
              <img src={logo} alt="Tuleva" className="img-responsive brand-logo mb-3 pb-3 mt-2" />
            </div>
          </div>
          <div className="row">
            <div className="col-lg-10 offset-lg-1 col-sm-12 offset-sm-0 text-center">
              <div className="col-lg-6 offset-lg-3 col-md-8 offset-md-2 col-sm-12">
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
            </div>
          </div>
          <div className="row">
            <div className="col-lg-12 text-center">
              <FacebookProvider appId="1939240566313354">
                <Like href="http://www.facebook.com/Tuleva.ee" colorScheme="dark" showFaces />
              </FacebookProvider>
            </div>
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
  onPhoneNumberSubmit: authenticateWithPhoneNumber,
  onCancelMobileAuthentication: cancelMobileAuthentication,
  onAuthenticateWithIdCard: authenticateWithIdCard,
}, dispatch);

const withRedux = connect(mapStateToProps, mapDispatchToProps);

export default withRedux(InlineLoginPage);
