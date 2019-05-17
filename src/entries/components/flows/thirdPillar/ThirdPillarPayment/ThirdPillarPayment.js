import React, { Fragment } from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { Message } from 'retranslate';

export const ThirdPillarPayment = ({ previousPath, signedMandateId, monthlyContribution }) => (
  <Fragment>
    {!signedMandateId && <Redirect to={previousPath} />}

    <h2 className="mt-3">
      <Message>thirdPillarPayment.title</Message>
    </h2>

    <p className="mt-3">
      <Message
        params={{
          emphasized: (
            <b>
              <Message>thirdPillarPayment.descriptionEphasized</Message>
            </b>
          ),
        }}
      >
        thirdPillarPayment.description
      </Message>
    </p>

    <div>
      <Message>thirdPillarPayment.accountName</Message>: <b>Pensionikeskus AS</b>
    </div>
    <div>
      <Message>thirdPillarPayment.accountNumber</Message>: <b>EE362200221067235244</b>
    </div>
    <div>
      <Message>thirdPillarPayment.amount</Message>:{' '}
      <b data-test-id="monthly-contribution">{monthlyContribution} EUR</b>
    </div>
    <div>
      <Message>thirdPillarPayment.details</Message>: <b>30101119828</b>
    </div>
    <div>
      <Message>thirdPillarPayment.reference</Message>:{' '}
      <b>
        <Message>thirdPillarPayment.pensionAccountNumber</Message>
      </b>
    </div>
  </Fragment>
);

ThirdPillarPayment.propTypes = {
  previousPath: Types.string,

  signedMandateId: Types.number,
  monthlyContribution: Types.number,
};

ThirdPillarPayment.defaultProps = {
  previousPath: '',

  signedMandateId: null,
  monthlyContribution: null,
};

const mapStateToProps = state => ({
  signedMandateId: state.thirdPillar.signedMandateId,
  monthlyContribution: state.thirdPillar.monthlyContribution,
});

const mapDispatchToProps = dispatch => bindActionCreators({}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ThirdPillarPayment);
