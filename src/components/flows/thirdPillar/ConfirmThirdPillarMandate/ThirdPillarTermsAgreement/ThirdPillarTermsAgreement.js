import React from 'react';
import Types from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { FormattedMessage, useIntl } from 'react-intl';
import { actions as thirdPillarActions } from '../../../../thirdPillar';

export const ThirdPillarTermsAgreement = ({ agreed, onAgreementChange }) => {
  const { formatMessage } = useIntl();

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
          <FormattedMessage id="thirdPillarAgreement.signingExplanation" />
        </label>
      </div>
    </div>
  );
};

ThirdPillarTermsAgreement.propTypes = {
  agreed: Types.bool,
  onAgreementChange: Types.func,
};

ThirdPillarTermsAgreement.defaultProps = {
  agreed: false,
  onAgreementChange: () => {},
};

const mapStateToProps = (state) => ({
  agreed: state.thirdPillar.agreedToTerms,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      onAgreementChange: thirdPillarActions.changeAgreementToTerms,
    },
    dispatch,
  );

export default connect(mapStateToProps, mapDispatchToProps)(ThirdPillarTermsAgreement);
