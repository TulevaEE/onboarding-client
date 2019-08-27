import React from 'react';
import Types from 'prop-types';
import { Message, WithTranslations } from 'retranslate';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { actions as thirdPillarActions } from '../../../../thirdPillar';

const RECOMMENDATION_AGE = 55;

export const ThirdPillarTermsAgreement = ({ age, agreed, onAgreementChange }) => {
  const showAgeDependentRecommendation = age && age >= RECOMMENDATION_AGE;

  return (
    <div className="mt-5">
      <div className="custom-control custom-checkbox">
        <input
          checked={agreed}
          onChange={() => onAgreementChange(!agreed)}
          type="checkbox"
          className="custom-control-input"
          id="third-pillar-terms-checkbox"
        />

        <label className="custom-control-label" htmlFor="third-pillar-terms-checkbox">
          <Message
            params={{
              link: (
                <WithTranslations>
                  {({ language }) => (
                    <a
                      href={
                        language === 'en'
                          ? 'https://www.pensionikeskus.ee/en/iii-pillar/supplementary-pension-funds/'
                          : 'https://www.pensionikeskus.ee/iii-sammas/vabatahtlikud-pensionifondid/'
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Message>thirdPillarAgreement.linkText</Message>
                    </a>
                  )}
                </WithTranslations>
              ),
            }}
          >
            thirdPillarAgreement.termsConfirmation
          </Message>{' '}
          {showAgeDependentRecommendation && (
            <>
              <Message>thirdPillarAgreement.ageDependentRecommendationConfirmation</Message>{' '}
            </>
          )}
          <Message>thirdPillarAgreement.signingExplanation</Message>
          {showAgeDependentRecommendation && (
            <div className="mt-2">
              <small className="text-muted">
                <Message>thirdPillarAgreement.ageDependentRecommendation</Message>
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

const mapStateToProps = state => ({
  agreed: state.thirdPillar.agreedToTerms,
  age: state.login.user ? state.login.user.age : null,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onAgreementChange: thirdPillarActions.changeAgreementToTerms,
    },
    dispatch,
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ThirdPillarTermsAgreement);
