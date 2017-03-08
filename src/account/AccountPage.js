import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message } from 'retranslate';

export const AccountPage = () => (
  <div>
    <div className="row">
      <div className="col">
        <h3 className="mt-5"><Message>account.current.balance.title</Message></h3>
        <p>
          <Message>account.current.balance.subtitle</Message>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.e-register.ee/"
          >
            <Message>account.current.balance.evk</Message>
          </a>
        </p>

        PENSION FUND TABLE WILL COME HERE
      </div>
    </div>
    <div className="row">
      <div className="col">
        <h3 className="mt-5"><Message>account.active.fund.title</Message></h3>

        ACTIVE PENSION FUND WILL COME HERE
      </div>
    </div>
    <div className="row">
      <div className="col">
        <h3 className="mt-5"><Message>account.tuleva.balance.title</Message></h3>
        <p><Message>account.tuleva.balance.subtitle</Message></p>
        TULEVA BALANCE WILL COME HERE
      </div>
    </div>
    <div className="row">
      <div className="col">
        <h3 className="mt-5"><Message>account.contact.info.title</Message></h3>
        CONTACT INFO WILL COME HERE
      </div>
    </div>
  </div>
);

// TODO: write component
const mapStateToProps = state => state;
const mapDispatchToProps = dispatch => bindActionCreators({}, dispatch);

const withRedux = connect(mapStateToProps, mapDispatchToProps);

export default withRedux(AccountPage);
