import { ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { usePageTitle } from '../../../common/usePageTitle';
import { ACCOUNT_PATH } from '../../../paths';
import { PaymentStep } from '../../common/PaymentStep/PaymentStep';
import { SuccessNotice2 } from '../../common/SuccessNotice2/SuccessNotice2';
import { PaymentBankButtons } from '../ThirdPillarPayment/PaymentBankButtons';
import '../ThirdPillarPayment/Payment.scss';
import {
  BankGuide,
  InternetBank,
  isStandingOrderBank,
  STANDING_ORDER_CHANGE_GUIDES,
  StandingOrderBank,
} from './standingOrderChangeSteps';
import { trackStandingOrderClick } from './tracking';

const bold = (chunks: ReactNode[]) => <b>{chunks}</b>;

const STEPS_HEADING_ID = 'standing-order-change-steps';

const BANK_PARAMETER = 'bank';

const CONFIRM_PARAMETER = 'confirm';

const CHANGED_PARAMETER = 'changed';

const PAGE_PARAMETERS = [BANK_PARAMETER, CONFIRM_PARAMETER, CHANGED_PARAMETER];

type Stage = typeof CONFIRM_PARAMETER | typeof CHANGED_PARAMETER;

const searchFor = (current: string, bank: StandingOrderBank | null, stage?: Stage) => {
  const query = new URLSearchParams(current);
  PAGE_PARAMETERS.forEach((parameter) => query.delete(parameter));
  if (bank) {
    query.set(BANK_PARAMETER, bank);
  }
  if (stage) {
    query.set(stage, '1');
  }
  return `?${query}`;
};

export const ThirdPillarStandingOrderPage = () => {
  usePageTitle('pageTitle.thirdPillarStandingOrder');
  const history = useHistory();
  const { pathname, search } = useLocation();
  const query = new URLSearchParams(search);
  const bankInAddress = query.get(BANK_PARAMETER);
  const bank = isStandingOrderBank(bankInAddress) ? bankInAddress : null;
  const changed = query.has(CHANGED_PARAMETER);
  const askingIfChanged = query.has(CONFIRM_PARAMETER);

  const pickBank = (picked: StandingOrderBank | null) => {
    history.replace({ search: searchFor(search, picked) });
    if (picked) {
      trackStandingOrderClick(pathname, 'standing-order-bank', { bank: picked });
    }
  };

  const openBank = (opened: StandingOrderBank) => {
    trackStandingOrderClick(pathname, 'standing-order-open-bank', { bank: opened });
    history.push({ search: searchFor(search, opened, CONFIRM_PARAMETER) });
  };

  if (changed) {
    return <ChangedNotice />;
  }

  if (askingIfChanged) {
    return (
      <ChangedQuestion
        onYes={() => history.replace({ search: searchFor(search, bank, CHANGED_PARAMETER) })}
        onShowSteps={() => history.replace({ search: searchFor(search, bank) })}
      />
    );
  }

  return (
    <div className="col-12 col-md-11 col-lg-8 mx-auto text-pretty">
      <h1 className="mb-3 text-balance">
        <FormattedMessage id="thirdPillarStandingOrder.title" />
      </h1>
      <p className="mb-4">
        <FormattedMessage id="thirdPillarStandingOrder.lead" />
      </p>

      <PaymentBankButtons
        paymentBank={bank}
        setPaymentBank={pickBank}
        otherLabel="thirdPillarStandingOrder.otherBank"
      />

      {bank && (
        <BankChangeGuide
          guide={STANDING_ORDER_CHANGE_GUIDES[bank]}
          onOpenBank={() => openBank(bank)}
        />
      )}

      <FooterLinks />
    </div>
  );
};

const BankChangeGuide = ({ guide, onOpenBank }: { guide: BankGuide; onOpenBank: () => void }) => (
  <>
    <ChangeSteps guide={guide} />
    {guide.internetBank && (
      <div className="mt-4 d-flex flex-column flex-sm-row justify-content-end">
        <OpenBankButton internetBank={guide.internetBank} onOpen={onOpenBank} />
      </div>
    )}
  </>
);

const OpenBankButton = ({
  internetBank,
  onOpen,
}: {
  internetBank: InternetBank;
  onOpen: () => void;
}) => (
  <a
    className="btn btn-primary btn-lg text-nowrap"
    href={internetBank.url}
    target="_blank"
    rel="noreferrer"
    onClick={onOpen}
  >
    <FormattedMessage id={internetBank.openLabel} />
  </a>
);

const ChangeSteps = ({ guide }: { guide: BankGuide }) => (
  <div className="mt-4 payment-details p-4">
    <h2 id={STEPS_HEADING_ID} className="h3 mb-3 text-balance">
      <FormattedMessage id={`thirdPillarStandingOrder.heading.${guide.changeMethod}`} />
    </h2>
    {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- Safari drops list semantics from lists styled list-style: none */}
    <ol className="list-unstyled mb-0" role="list" aria-labelledby={STEPS_HEADING_ID}>
      {guide.steps.map((step, index) => (
        <li key={step.text}>
          <PaymentStep number={index + 1}>
            <FormattedMessage id={step.text} values={{ b: bold }} />
            {step.amountEntered && <TaxRefundReminder />}
          </PaymentStep>
        </li>
      ))}
    </ol>
  </div>
);

const TaxRefundReminder = () => (
  <p className="small text-body-secondary mt-1 mb-0">
    <FormattedMessage id="thirdPillarStandingOrder.taxReminder" />
  </p>
);

const ChangedQuestion = ({
  onYes,
  onShowSteps,
}: {
  onYes: () => void;
  onShowSteps: () => void;
}) => (
  <div className="col-12 col-md-11 col-lg-8 mx-auto text-center py-5">
    <h1 className="mb-4 text-balance">
      <FormattedMessage id="thirdPillarStandingOrder.changedQuestion.title" />
    </h1>
    <div className="d-flex gap-2 justify-content-center flex-wrap">
      <button type="button" className="btn btn-primary" onClick={onYes}>
        <FormattedMessage id="thirdPillarPayment.confirmation.yes" />
      </button>
      <button type="button" className="btn btn-outline-primary" onClick={onShowSteps}>
        <FormattedMessage id="thirdPillarStandingOrder.changedQuestion.showSteps" />
      </button>
    </div>
  </div>
);

const ChangedNotice = () => (
  <SuccessNotice2 className="text-pretty">
    <h2 className="my-3">
      <FormattedMessage id="thirdPillarStandingOrder.changed.title" />
    </h2>
    <Link className="btn btn-outline-primary mt-3" to={ACCOUNT_PATH}>
      <FormattedMessage id="thirdPillarSuccess.button.account" />
    </Link>
  </SuccessNotice2>
);

const FooterLinks = () => {
  const { formatMessage } = useIntl();

  return (
    <ul className="list-unstyled mt-5 mb-0 d-flex flex-column gap-2">
      <li>
        <Link to={{ pathname: '/3rd-pillar-payment', search: '?type=RECURRING' }}>
          <FormattedMessage id="thirdPillarStandingOrder.footer.setUpNew" />
        </Link>
      </li>
      <li>
        <Link to="/3rd-pillar-employer">
          <FormattedMessage id="thirdPillarStandingOrder.footer.employer" />
        </Link>
      </li>
      <li>
        <a
          href={formatMessage({ id: 'thirdPillarStandingOrder.footer.calculator.link' })}
          target="_blank"
          rel="noreferrer"
        >
          <FormattedMessage id="thirdPillarStandingOrder.footer.calculator" />
        </a>
      </li>
    </ul>
  );
};
