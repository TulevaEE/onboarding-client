import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { InjectedFormProps, reduxForm } from 'redux-form';
import { captureException } from '@sentry/browser';
import { State } from '../../../types';
import ThirdPillarTermsAgreement from '../thirdPillar/ConfirmThirdPillarMandate/ThirdPillarTermsAgreement';
import ResidencyAgreement from '../../aml/ResidencyAgreement';
import OccupationAgreement from '../../aml/OccupationAgreement';
import PoliticallyExposedPersonAgreement from '../../aml/PoliticallyExposedPersonAgreement';
import { AuthenticationLoader, ErrorMessage } from '../../common';
import { isSigningWithIdCard } from '../../common/authenticationManager';
import { cancelThirdPillarPaymentReminder } from '../../common/api';
import { MandateRequest, User } from '../../common/apiModels';
import { signMandate } from '../../exchange/actions';
import { useMandateSigning } from '../../exchange/hooks';
import { forgetSignedMandate } from '../../thirdPillar/actions';
import { TULEVA_3RD_PILLAR_FUND_ISIN } from '../../thirdPillar/initialState';

type Props = { nextPath: string };

const selectionOnlyMandate = (address: User['address']): MandateRequest => ({
  fundTransferExchanges: [],
  futureContributionFundIsin: TULEVA_3RD_PILLAR_FUND_ISIN,
  address,
});

const useAmlAnswers = () =>
  useSelector(
    ({ aml: { isResident, isPoliticallyExposed, occupation } }: State) => ({
      isResident,
      isPoliticallyExposed,
      occupation,
    }),
    shallowEqual,
  );

const useSignedHere = (nextPath: string) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const signedMandateId = useSelector((state: State) => state.thirdPillar.signedMandateId);
  const [signingHere, setSigningHere] = useState(false);

  useEffect(() => {
    if (signingHere && signedMandateId) {
      dispatch(forgetSignedMandate());
      cancelThirdPillarPaymentReminder().catch(captureException);
      history.push(nextPath);
    }
  }, [signingHere, signedMandateId, dispatch, history, nextPath]);

  const startSigning = () => {
    dispatch(forgetSignedMandate());
    setSigningHere(true);
  };

  return { startSigning, stopSigning: () => setSigningHere(false) };
};

const Selection = ({ nextPath }: Props & InjectedFormProps<Record<string, never>, Props>) => {
  const dispatch = useDispatch();
  const address = useSelector((state: State) => state.login.user.address);
  const agreedToTerms = useSelector((state: State) => state.thirdPillar.agreedToTerms);
  const amlAnswers = useAmlAnswers();
  const savingAnswers = useSelector((state: State) => state.aml.loading);
  const { loading, challengeCode, error, cancel, resetError } = useMandateSigning();
  const { startSigning, stopSigning } = useSignedHere(nextPath);

  const allAnswered =
    agreedToTerms &&
    amlAnswers.isResident &&
    !!amlAnswers.occupation &&
    amlAnswers.isPoliticallyExposed !== null;

  const sign = () => {
    startSigning();
    dispatch(signMandate(selectionOnlyMandate(address), amlAnswers));
  };

  const cancelSigning = () => {
    stopSigning();
    cancel();
  };

  return (
    <>
      {(loading || challengeCode) && (
        <AuthenticationLoader
          signingWithIdCard={isSigningWithIdCard()}
          controlCode={challengeCode}
          onCancel={cancelSigning}
          overlayed
        />
      )}
      {error && <ErrorMessage errors={error.body} onCancel={resetError} overlayed />}

      <p className="text-pretty">
        <FormattedMessage id="insuranceTransfer.selection.intro" />
      </p>

      <ThirdPillarTermsAgreement />
      <ResidencyAgreement className="mt-3" />
      <OccupationAgreement className="col-md-5 mt-3 px-0" />
      <PoliticallyExposedPersonAgreement className="mt-3" />

      <button
        type="button"
        className="btn btn-primary mt-5"
        disabled={!allAnswered || savingAnswers || loading || !!challengeCode}
        onClick={sign}
      >
        <FormattedMessage id="confirm.mandate.sign" />
      </button>
    </>
  );
};

export const InsuranceTransferSelection = reduxForm<Record<string, never>, Props>({
  form: 'insuranceTransferSelection',
})(Selection);
