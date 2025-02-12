import React from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { FormattedMessage, useIntl } from 'react-intl';
import { actions as thirdPillarActions } from '../../../../thirdPillar';

const RECOMMENDATION_AGE = 55;

export const ThirdPillarTermsAgreement = ({ age, agreed, onAgreementChange }) => {
  const { formatMessage } = useIntl();

  const showAgeDependentRecommendation = age && age >= RECOMMENDATION_AGE;

  return (
    <div className="mt-5">
      <div className="form-check">
        <input
          checked={agreed}
          onChange={() => onAgreementChange(!agreed)}
          type="checkbox"
          className="form-check-input"
          id="third-pillar-terms-checkbox"
        />

        <label className="form-check-label" htmlFor="third-pillar-terms-checkbox">
          <FormattedMessage
            id="thirdPillarAgreement.termsConfirmation"
            values={{
              a: (chunks) => (
                <a
                  href={formatMessage({ id: 'thirdPillarAgreement.termsConfirmation.link' })}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {chunks}
                </a>
              ),
            }}
          />{' '}
          {showAgeDependentRecommendation && (
            <>
              <FormattedMessage id="thirdPillarAgreement.ageDependentRecommendationConfirmation" />{' '}
            </>
          )}
          <FormattedMessage id="thirdPillarAgreement.signingExplanation" />
          {showAgeDependentRecommendation && (
            <div className="mt-2">
              <small className="text-body-secondary">
                <FormattedMessage id="thirdPillarAgreement.ageDependentRecommendation" />
              </small>
            </div>
          )}
        </label>
      </div>
    </div>
  );
};

ThirdPillarTermsAgreement.propTypes = {
  age: Types.number,
  agreed: Types.bool,
  onAgreementChange: Types.func,
};

ThirdPillarTermsAgreement.defaultProps = {
  age: null,
  agreed: false,
  onAgreementChange: () => {},
};

const mapStateToProps = (state) => ({
  agreed: state.thirdPillar.agreedToTerms,
  age: state.login.user ? state.login.user.age : null,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      onAgreementChange: thirdPillarActions.changeAgreementToTerms,
    },
    dispatch,
  );

export default connect(mapStateToProps, mapDispatchToProps)(ThirdPillarTermsAgreement);
