import React, { Fragment } from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';
import { Message } from 'retranslate';

import ThirdPillarTermsAgreement from './ThirdPillarTermsAgreement';

export const ConfirmThirdPillarMandate = ({
  previousPath,
  monthlyContribution,
  selectedFutureContributionsFund,
  agreedToTerms,
}) => (
  <Fragment>
    {(!monthlyContribution || !selectedFutureContributionsFund) && <Redirect to={previousPath} />}

    <Message>confirmThirdPillarMandate.intro</Message>

    {selectedFutureContributionsFund && (
      <div className="mt-4">
        <Message>confirmThirdPillarMandate.contribution</Message>

        <div>
          <b className="highlight">{selectedFutureContributionsFund.name}</b>
        </div>
      </div>
    )}

    <ThirdPillarTermsAgreement />

    <div className="mt-5">
      <button
        type="button"
        className="btn btn-primary mb-2 mr-2"
        disabled={!agreedToTerms}
        onClick={() => {
          alert('See funktsionaalsus pole hetkel kättesaadav.');
        }}
      >
        <Message>confirmThirdPillarMandate.sign</Message>
      </button>

      <button
        type="button"
        className="btn btn-secondary mb-2 mr-2"
        onClick={() => {
          alert('See funktsionaalsus pole hetkel kättesaadav.');
        }}
      >
        <Message>confirmThirdPillarMandate.preview</Message>
      </button>

      <Link to={previousPath}>
        <button type="button" className="btn btn-secondary mb-2">
          <Message>confirmThirdPillarMandate.back</Message>
        </button>
      </Link>
    </div>
  </Fragment>
);

ConfirmThirdPillarMandate.propTypes = {
  previousPath: Types.string,

  monthlyContribution: Types.number,
  selectedFutureContributionsFund: Types.shape({ name: Types.string }),
  agreedToTerms: Types.bool,
};

ConfirmThirdPillarMandate.defaultProps = {
  previousPath: '',

  monthlyContribution: null,
  selectedFutureContributionsFund: null,
  agreedToTerms: false,
};

const mapStateToProps = state => ({
  selectedFutureContributionsFund: state.thirdPillar.targetFunds.find(
    fund => fund.isin === state.thirdPillar.selectedFutureContributionsFundIsin,
  ),
  agreedToTerms: state.thirdPillar.agreedToTerms,
  monthlyContribution: state.thirdPillar.monthlyContribution,
  exchangeExistingUnits: state.thirdPillar.exchangeExistingUnits,
});

const mapDispatchToProps = dispatch => bindActionCreators({}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ConfirmThirdPillarMandate);
