import React, { Fragment } from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message } from 'retranslate';

export const ConfirmThirdPillarMandate = ({ selectedFutureContributionsFund }) => (
  <Fragment>
    {selectedFutureContributionsFund && <Message>confirmThirdPillarMandate.intro</Message>}

    {selectedFutureContributionsFund && (
      <div className="mt-4">
        <Message>confirmThirdPillarMandate.contribution</Message>

        <div>
          <b className="highlight">{selectedFutureContributionsFund.name}</b>
        </div>
      </div>
    )}
  </Fragment>
);

ConfirmThirdPillarMandate.propTypes = {
  selectedFutureContributionsFund: Types.shape({ name: Types.string }),
};

ConfirmThirdPillarMandate.defaultProps = {
  selectedFutureContributionsFund: null,
};

const mapStateToProps = state => ({
  selectedFutureContributionsFund: state.thirdPillar.targetFunds.find(
    fund => fund.isin === state.thirdPillar.selectedFutureContributionsFundIsin,
  ),
  monthlyContribution: state.thirdPillar.monthlyContribution,
  exchangeExistingUnits: state.thirdPillar.exchangeExistingUnits,
});

const mapDispatchToProps = dispatch => bindActionCreators({}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ConfirmThirdPillarMandate);
