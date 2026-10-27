import { ReactNode, useState } from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { Link, Redirect, useHistory, useLocation, useRouteMatch } from 'react-router-dom';
import { AuthenticationLoader, ErrorMessage, Loader } from '../../common';
import { getRejoinPermission } from '../../common/api';
import {
  useCreateMandateBatch,
  useFunds,
  useMandateDeadlines,
  useMe,
  usePendingApplications,
  useSourceFunds,
} from '../../common/apiHooks';
import { Application, ErrorResponse, Fund, SourceFund, User } from '../../common/apiModels';
import {
  CreateMandateDto,
  PaymentRateChangeMandateDetails,
} from '../../common/apiModels/withdrawals';
import { isSigningWithIdCard } from '../../common/authenticationManager';
import { TulevaSecondPillarStockFund } from '../../common/utils';
import { PaymentRate } from '../secondPillarPaymentRate/types';
import { FundChoice, PaymentRateChoice } from './RejoinChoices';
import Checkbox from '../../common/checkbox/Checkbox';
import { RejoinDisclaimers } from './RejoinDisclaimers';
import { useMandateBatchSigning } from '../withdrawals/signing/useMandateBatchSigning';
import { TranslationKey } from '../../translations';
import { flowPath, reviewPath, successPath } from './secondPillarRejoinPaths';
import { RejoinSummary } from './SecondPillarRejoinSuccess';
import { PendingRejoinApplication } from './PendingRejoinApplication';
import { isRejoinApplication } from '../../account/ApplicationSection/ApplicationFunctions';
import { usePageTitle } from '../../common/usePageTitle';

const DEFAULT_PAYMENT_RATE: PaymentRate = 6;
const RECOMMENDED_FUND_ISIN: TulevaSecondPillarStockFund = 'EE3600109435';
const PAYMENT_RATE_NAMES: Record<PaymentRate, PaymentRateChangeMandateDetails['paymentRate']> = {
  2: 'TWO',
  4: 'FOUR',
  6: 'SIX',
};

const bold = (chunks: ReactNode) => <b>{chunks}</b>;

const isOpenForContributions = (fund: Fund) => fund.pillar === 2 && fund.status === 'ACTIVE';

const activeSecondPillarFundIsin = (sourceFunds: SourceFund[] | undefined) =>
  sourceFunds?.find((fund) => fund.pillar === 2 && fund.activeFund)?.isin;

const paymentRateThatApplies = (user: User | undefined) =>
  user?.secondPillarPaymentRates?.pending ?? user?.secondPillarPaymentRates?.current;

const monthOf = (date: string) => moment(date).month() + 1;

const RejoinHeader = ({ contributionStartDate }: { contributionStartDate: string }) => (
  <>
    <h1 className="mb-3 text-balance">
      <FormattedMessage id="secondPillarRejoin.heading" />
    </h1>
    <p className="lead mb-5 text-balance">
      <FormattedMessage
        id="secondPillarRejoin.lead"
        values={{ b: bold, startMonth: monthOf(contributionStartDate) }}
      />
    </p>
  </>
);

export const SecondPillarRejoin = () => {
  usePageTitle('pageTitle.secondPillarRejoin');
  const history = useHistory();
  const { search } = useLocation();
  const isReviewing = useRouteMatch(reviewPath) !== null;
  const { data: funds } = useFunds();
  const { data: mandateDeadlines } = useMandateDeadlines();
  const { data: sourceFunds, isLoading: isLoadingSourceFunds } = useSourceFunds();
  const { data: user, isLoading: isLoadingUser } = useMe();
  const { data: pendingApplications, isFetchedAfterMount: hasCheckedPendingApplications } =
    usePendingApplications();

  if (
    !funds ||
    !mandateDeadlines ||
    isLoadingSourceFunds ||
    isLoadingUser ||
    !hasCheckedPendingApplications
  ) {
    return <Loader className="align-middle my-4" />;
  }

  return (
    <div className="col-12 col-md-11 col-lg-8 mx-auto">
      <RejoinApplication
        funds={funds.filter(isOpenForContributions)}
        activeFundIsin={activeSecondPillarFundIsin(sourceFunds)}
        paymentRateOnFile={paymentRateThatApplies(user)}
        contributionStartDate={mandateDeadlines.secondPillarRejoinContributionStartDate}
        cancellationDeadline={mandateDeadlines.secondPillarRejoinDeadline}
        pendingApplications={pendingApplications}
        isReviewing={isReviewing}
        onReview={() => history.push({ pathname: reviewPath, search })}
        onBack={() => history.goBack()}
      />
    </div>
  );
};

type RejoinRefusal = 'notPermitted' | 'permissionUnknown';

const REFUSAL_MESSAGES: Record<RejoinRefusal, TranslationKey> = {
  notPermitted: 'secondPillarRejoin.notPermitted',
  permissionUnknown: 'secondPillarRejoin.permissionUnknown',
};

const askPensionikeskus = async (): Promise<RejoinRefusal | null> => {
  try {
    const { permitted } = await getRejoinPermission();
    return permitted ? null : 'notPermitted';
  } catch {
    return 'permissionUnknown';
  }
};

const RejoinApplication = ({
  funds,
  activeFundIsin,
  paymentRateOnFile,
  contributionStartDate,
  cancellationDeadline,
  pendingApplications,
  isReviewing,
  onReview,
  onBack,
}: {
  funds: Fund[];
  activeFundIsin: string | undefined;
  paymentRateOnFile: number | undefined;
  contributionStartDate: string;
  cancellationDeadline: string;
  pendingApplications: Application[] | undefined;
  isReviewing: boolean;
  onReview: () => void;
  onBack: () => void;
}) => {
  const { search } = useLocation();
  const { mutateAsync: createMandateBatch } = useCreateMandateBatch();
  const {
    startSigning,
    cancelSigning,
    signed,
    error: signingError,
    loading: signingInProgress,
    challengeCode,
  } = useMandateBatchSigning();
  const [paymentRate, setPaymentRate] = useState<PaymentRate>(DEFAULT_PAYMENT_RATE);
  const [fundIsin, setFundIsin] = useState<string>(RECOMMENDED_FUND_ISIN);
  const [isPaymentRateOpen, setPaymentRateOpen] = useState(false);
  const [isFundOpen, setFundOpen] = useState(false);
  const [batchCreationError, setBatchCreationError] = useState<ErrorResponse | null>(null);
  const [isCreatingBatch, setCreatingBatch] = useState(false);
  const [refusal, setRefusal] = useState<RejoinRefusal | null>(null);
  const [hasAgreedToTerms, setAgreedToTerms] = useState(false);
  const [hasFilledApplication, setFilledApplication] = useState(false);

  const chooseFund = (isin: string) => {
    setFundIsin(isin);
    setAgreedToTerms(false);
  };

  const chosenFund = funds.find((fund) => fund.isin === fundIsin) ?? null;
  const isAlreadyAtDefaultPaymentRate = paymentRateOnFile === DEFAULT_PAYMENT_RATE;
  const isChangingPaymentRate = paymentRate !== paymentRateOnFile;
  const isAlreadyInRecommendedFund = activeFundIsin === RECOMMENDED_FUND_ISIN;
  const isChangingFund = fundIsin !== activeFundIsin;
  const hasChoices = !isAlreadyAtDefaultPaymentRate || !isAlreadyInRecommendedFund;
  const isAwaitingFundTerms = isChangingFund && !hasAgreedToTerms;
  const paymentRateChange: CreateMandateDto[] = isChangingPaymentRate
    ? [
        {
          details: {
            mandateType: 'PAYMENT_RATE_CHANGE',
            paymentRate: PAYMENT_RATE_NAMES[paymentRate],
          },
        },
      ]
    : [];
  const fundSelection: CreateMandateDto[] = isChangingFund
    ? [{ details: { mandateType: 'SELECTION', futureContributionFundIsin: fundIsin } }]
    : [];
  const isSubmitting = isCreatingBatch || signingInProgress || !!challengeCode;
  const pendingRejoin = pendingApplications?.find(isRejoinApplication);

  if (signed) {
    const summary: RejoinSummary = {
      contributionStartDate,
      cancellationDeadline,
      paymentRate,
      fundName: chosenFund?.name ?? null,
    };
    return <Redirect to={{ pathname: successPath, search, state: summary }} />;
  }

  if (isReviewing && !hasFilledApplication) {
    return <Redirect to={{ pathname: flowPath, search }} />;
  }

  if (pendingRejoin && !isSubmitting) {
    return <PendingRejoinApplication application={pendingRejoin} />;
  }

  const review = () => {
    setFilledApplication(true);
    onReview();
  };

  const createBatchAndStartSigning = async () => {
    setCreatingBatch(true);
    setRefusal(null);
    const permissionRefusal = await askPensionikeskus();
    if (permissionRefusal) {
      setRefusal(permissionRefusal);
      setCreatingBatch(false);
      return;
    }
    try {
      const mandateBatch = await createMandateBatch({
        mandates: [{ details: { mandateType: 'REJOIN' } }, ...paymentRateChange, ...fundSelection],
      });
      startSigning(mandateBatch);
    } catch (e) {
      setBatchCreationError(e as ErrorResponse);
    }
    setCreatingBatch(false);
  };

  return (
    <>
      {isSubmitting && (
        <AuthenticationLoader
          signingWithIdCard={isSigningWithIdCard()}
          controlCode={challengeCode}
          onCancel={cancelSigning}
          overlayed
        />
      )}
      {signingError && (
        <ErrorMessage errors={signingError.body} onCancel={cancelSigning} overlayed />
      )}
      {batchCreationError && (
        <ErrorMessage
          errors={batchCreationError.body}
          onCancel={() => setBatchCreationError(null)}
          overlayed
        />
      )}
      {isReviewing ? (
        <>
          <h1 className="mb-4">
            <FormattedMessage id="secondPillarRejoin.review.heading" />
          </h1>
          <p className="mb-3 fw-medium">
            <FormattedMessage id="secondPillarRejoin.review.intro" />
          </p>
          <ApplicationCard
            id="rejoin-application"
            titleId="secondPillarRejoin.review.rejoin.title"
            notes={<RejoinDisclaimers className="mt-3" />}
          >
            <FormattedMessage id="secondPillarRejoin.review.rejoin" />
          </ApplicationCard>
          {isChangingPaymentRate && (
            <ApplicationCard
              id="rejoin-payment-rate"
              titleId="secondPillarRejoin.review.paymentRate.title"
            >
              <FormattedMessage
                id="secondPillarRejoin.review.paymentRate"
                values={{ rate: paymentRate }}
              />
            </ApplicationCard>
          )}
          {isChangingFund && chosenFund && (
            <ApplicationCard id="rejoin-fund" titleId="secondPillarRejoin.review.fund.title">
              <FormattedMessage
                id="secondPillarRejoin.review.fund"
                values={{ fund: chosenFund.name }}
              />
            </ApplicationCard>
          )}
          {isChangingFund && (
            <Checkbox
              id="rejoin-agree-to-terms"
              className="mt-4"
              checked={hasAgreedToTerms}
              onToggle={setAgreedToTerms}
            >
              <FormattedMessage id="secondPillarRejoin.review.terms" />
              <div className="mt-2">
                <span className="text-body-secondary">
                  <FormattedMessage
                    id="secondPillarRejoin.review.compareFunds"
                    values={{
                      a: (chunks: ReactNode) => (
                        <a
                          className="link-secondary"
                          target="_blank"
                          rel="noopener noreferrer"
                          href="https://www.pensionikeskus.ee/ii-sammas/kohustuslikud-pensionifondid/"
                        >
                          {chunks}
                        </a>
                      ),
                    }}
                  />
                </span>
              </div>
            </Checkbox>
          )}
          {refusal && (
            <p className="alert alert-warning mt-4 mb-0" role="alert">
              <FormattedMessage id={REFUSAL_MESSAGES[refusal]} />
            </p>
          )}
          <div className="mt-5 d-flex justify-content-between align-items-center">
            <button
              type="button"
              className="btn btn-light"
              disabled={isCreatingBatch || signingInProgress}
              onClick={onBack}
            >
              <FormattedMessage id="withdrawals.navigation.back" />
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={isAwaitingFundTerms || isCreatingBatch || signingInProgress}
              onClick={createBatchAndStartSigning}
            >
              <FormattedMessage id="confirm.mandate.sign" />
            </button>
          </div>
        </>
      ) : (
        <>
          <RejoinHeader contributionStartDate={contributionStartDate} />
          {hasChoices && (
            <div className="border-top mb-5">
              {!isAlreadyAtDefaultPaymentRate && (
                <PaymentRateChoice
                  paymentRate={paymentRate}
                  onChange={setPaymentRate}
                  open={isPaymentRateOpen}
                  onToggle={() => setPaymentRateOpen(!isPaymentRateOpen)}
                />
              )}
              {!isAlreadyInRecommendedFund && (
                <FundChoice
                  funds={funds}
                  recommendedFundIsin={RECOMMENDED_FUND_ISIN}
                  fundIsin={fundIsin}
                  onChange={chooseFund}
                  open={isFundOpen}
                  onToggle={() => setFundOpen(!isFundOpen)}
                />
              )}
            </div>
          )}
          <div className="d-flex flex-column-reverse flex-md-row justify-content-between">
            <Link className="btn btn-light mt-2" to="/account">
              <FormattedMessage id="secondPillarPaymentRate.cancel" />
            </Link>
            <button type="button" className="btn btn-primary mt-2" onClick={review}>
              <FormattedMessage id="secondPillarRejoin.next" />
            </button>
          </div>
        </>
      )}
    </>
  );
};

const ApplicationCard = ({
  id,
  titleId,
  notes,
  children,
}: {
  id: string;
  titleId: TranslationKey;
  notes?: ReactNode;
  children: ReactNode;
}) => (
  <section className="card my-3 p-4" aria-labelledby={id}>
    <h2 className="h5 fw-semibold mb-1" id={id}>
      {children}
    </h2>
    <p className="text-secondary m-0">
      <FormattedMessage id={titleId} />
    </p>
    {notes}
  </section>
);
