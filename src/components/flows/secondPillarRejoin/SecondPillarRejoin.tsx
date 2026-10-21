import { ReactNode, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { AuthenticationLoader, ErrorMessage, Loader } from '../../common';
import { getRejoinPermission } from '../../common/api';
import { useCreateMandateBatch, useFunds } from '../../common/apiHooks';
import { ErrorResponse, Fund } from '../../common/apiModels';
import { PaymentRateChangeMandateDetails } from '../../common/apiModels/withdrawals';
import { isSigningWithIdCard } from '../../common/authenticationManager';
import { TulevaSecondPillarStockFund } from '../../common/utils';
import { SuccessNotice } from '../common/SuccessNotice/SuccessNotice';
import { PaymentRate } from '../secondPillarPaymentRate/types';
import { RejoinCalculator } from './RejoinCalculator';
import { FundChoice, PaymentRateChoice } from './RejoinChoices';
import Checkbox from '../../common/checkbox/Checkbox';
import { RejoinDisclaimers } from './RejoinDisclaimers';
import { STATE_CONTRIBUTION_PERCENT } from './rejoinContributions';
import { useMandateBatchSigning } from '../withdrawals/signing/useMandateBatchSigning';
import { TranslationKey } from '../../translations';
import { useView } from './variants';

const EXAMPLE_GROSS_SALARY = 2000;
const DEFAULT_PAYMENT_RATE: PaymentRate = 6;
const RECOMMENDED_FUND_ISIN: TulevaSecondPillarStockFund = 'EE3600109435';
const PAYMENT_RATE_NAMES: Record<PaymentRate, PaymentRateChangeMandateDetails['paymentRate']> = {
  2: 'TWO',
  4: 'FOUR',
  6: 'SIX',
};

const bold = (chunks: ReactNode) => <b>{chunks}</b>;

const isOpenForContributions = (fund: Fund) => fund.pillar === 2 && fund.status === 'ACTIVE';

const RejoinHeader = () => (
  <>
    <h1 className="mb-3 text-balance">
      <FormattedMessage id="secondPillarRejoin.heading" />
    </h1>
    <p className="lead mb-5 text-balance">
      <FormattedMessage id="secondPillarRejoin.lead" values={{ b: bold }} />
    </p>
  </>
);

export const SecondPillarRejoin = () => {
  const [view, setView] = useView();
  const { data: funds } = useFunds();
  const [grossSalary, setGrossSalary] = useState<number | undefined>(EXAMPLE_GROSS_SALARY);

  if (!funds) {
    return <Loader className="align-middle my-4" />;
  }

  if (view === 'calculator') {
    return (
      <RejoinCalculator
        grossSalary={grossSalary}
        onGrossSalaryChange={setGrossSalary}
        exampleSalary={EXAMPLE_GROSS_SALARY}
        paymentRate={DEFAULT_PAYMENT_RATE}
        onStart={() => setView('application')}
      />
    );
  }

  return (
    <div className="col-12 col-md-11 col-lg-8 mx-auto">
      <RejoinApplication
        funds={funds.filter(isOpenForContributions)}
        isReviewing={view === 'review'}
        onReview={() => setView('review')}
        onBack={() => setView('application')}
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
  isReviewing,
  onReview,
  onBack,
}: {
  funds: Fund[];
  isReviewing: boolean;
  onReview: () => void;
  onBack: () => void;
}) => {
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

  const chosenFund = funds.find((fund) => fund.isin === fundIsin) ?? null;

  if (signed) {
    return <RejoinSuccess paymentRate={paymentRate} chosenFund={chosenFund} />;
  }

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
        mandates: [
          { details: { mandateType: 'REJOIN' } },
          {
            details: {
              mandateType: 'PAYMENT_RATE_CHANGE',
              paymentRate: PAYMENT_RATE_NAMES[paymentRate],
            },
          },
          { details: { mandateType: 'SELECTION', futureContributionFundIsin: fundIsin } },
        ],
      });
      startSigning(mandateBatch);
    } catch (e) {
      setBatchCreationError(e as ErrorResponse);
    }
    setCreatingBatch(false);
  };

  return (
    <>
      {(isCreatingBatch || signingInProgress || challengeCode) && (
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
          <ApplicationCard
            id="rejoin-payment-rate"
            titleId="secondPillarRejoin.review.paymentRate.title"
          >
            <FormattedMessage
              id="secondPillarRejoin.review.paymentRate"
              values={{ rate: paymentRate }}
            />
          </ApplicationCard>
          {chosenFund && (
            <ApplicationCard id="rejoin-fund" titleId="secondPillarRejoin.review.fund.title">
              <FormattedMessage
                id="secondPillarRejoin.review.fund"
                values={{ fund: chosenFund.name }}
              />
            </ApplicationCard>
          )}
          <Checkbox
            id="rejoin-agree-to-terms"
            className="mt-4"
            checked={hasAgreedToTerms}
            onToggle={setAgreedToTerms}
          >
            <FormattedMessage id="secondPillarRejoin.review.terms" />
            <div className="mt-2">
              <small className="text-body-secondary">
                <a
                  className="link-secondary"
                  target="_blank"
                  rel="noopener noreferrer"
                  href="//www.pensionikeskus.ee/ii-sammas/kohustuslikud-pensionifondid/fonditasude-vordlus/"
                >
                  <FormattedMessage id="confirm.mandate.pension.centre" />
                </a>
                <FormattedMessage id="confirm.mandate.view.info" />
              </small>
            </div>
          </Checkbox>
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
              disabled={!hasAgreedToTerms || isCreatingBatch || signingInProgress}
              onClick={createBatchAndStartSigning}
            >
              <FormattedMessage id="confirm.mandate.sign" />
            </button>
          </div>
        </>
      ) : (
        <>
          <RejoinHeader />
          <div className="border-top mb-5">
            <PaymentRateChoice
              paymentRate={paymentRate}
              onChange={setPaymentRate}
              open={isPaymentRateOpen}
              onToggle={() => setPaymentRateOpen(!isPaymentRateOpen)}
            />
            <FundChoice
              funds={funds}
              recommendedFundIsin={RECOMMENDED_FUND_ISIN}
              fundIsin={fundIsin}
              onChange={setFundIsin}
              open={isFundOpen}
              onToggle={() => setFundOpen(!isFundOpen)}
            />
          </div>
          <div className="d-flex flex-column-reverse flex-md-row justify-content-between">
            <Link className="btn btn-light mt-2" to="/account">
              <FormattedMessage id="secondPillarPaymentRate.cancel" />
            </Link>
            <button type="button" className="btn btn-primary mt-2" onClick={onReview}>
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
    <p className="small text-secondary m-0">
      <FormattedMessage id={titleId} />
    </p>
    {notes}
  </section>
);

const SummaryItem = ({ label, children }: { label: ReactNode; children: ReactNode }) => (
  <li className="d-flex justify-content-between gap-3 py-2 border-top">
    <span>{label}</span> <b className="text-end">{children}</b>
  </li>
);

const RejoinSuccess = ({
  paymentRate,
  chosenFund,
}: {
  paymentRate: PaymentRate;
  chosenFund: Fund | null;
}) => {
  const { formatMessage } = useIntl();

  return (
    <SuccessNotice>
      <h2 className="text-center mt-3">
        <FormattedMessage id="secondPillarRejoin.success.heading" />
      </h2>
      <ul
        className="list-unstyled text-start mx-auto mt-4 mb-0"
        style={{ maxWidth: '26rem' }}
        aria-label={formatMessage({ id: 'secondPillarRejoin.success.summary' })}
      >
        <SummaryItem
          label={<FormattedMessage id="secondPillarRejoin.success.contributionsStart" />}
        >
          <FormattedMessage id="secondPillarRejoin.success.contributionsStartDate" />
        </SummaryItem>
        <SummaryItem label={<FormattedMessage id="secondPillarRejoin.paymentRate.label" />}>
          <FormattedMessage
            id="secondPillarRejoin.paymentRate.value"
            values={{ rate: paymentRate }}
          />
        </SummaryItem>
        <SummaryItem label={<FormattedMessage id="secondPillarRejoin.success.stateAdds" />}>
          <FormattedMessage
            id="secondPillarRejoin.paymentRate.value"
            values={{ rate: STATE_CONTRIBUTION_PERCENT }}
          />
        </SummaryItem>
        {chosenFund && (
          <SummaryItem label={<FormattedMessage id="secondPillarRejoin.fund.label" />}>
            {chosenFund.name}
          </SummaryItem>
        )}
      </ul>
    </SuccessNotice>
  );
};
