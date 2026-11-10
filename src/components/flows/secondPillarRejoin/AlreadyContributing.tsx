import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { Loader } from '../../common';
import { useConversion } from '../../common/apiHooks';
import { TranslationKey } from '../../translations';

const MAXIMUM_PAYMENT_RATE = 6;

type NextStep = { to: string; label: TranslationKey };

const BRING_TO_TULEVA: NextStep = {
  to: '/2nd-pillar-flow',
  label: 'account.status.choice.bring.to.tuleva',
};
const RAISE_PAYMENT_RATE: NextStep = {
  to: '/2nd-pillar-payment-rate',
  label: 'account.status.choice.paymentRate.increase',
};

const nextStep = (isInTuleva: boolean, paymentRate: number | undefined): NextStep | null => {
  if (!isInTuleva) {
    return BRING_TO_TULEVA;
  }
  if (paymentRate !== undefined && paymentRate < MAXIMUM_PAYMENT_RATE) {
    return RAISE_PAYMENT_RATE;
  }
  return null;
};

export const AlreadyContributing = ({ paymentRate }: { paymentRate: number | undefined }) => {
  const { data: conversion, isLoading } = useConversion();

  if (isLoading) {
    return <Loader className="align-middle my-4" />;
  }

  const isInTuleva =
    conversion?.secondPillar.selectionComplete === true &&
    conversion?.secondPillar.transfersComplete === true;
  const step = conversion ? nextStep(isInTuleva, paymentRate) : null;

  return (
    <>
      <h1 className="mb-4 text-balance">
        <FormattedMessage id="pageTitle.secondPillarRejoin" />
      </h1>
      <p className="mb-4 text-pretty">
        <FormattedMessage id="secondPillarRejoin.alreadyContributing" />
      </p>
      {step ? (
        <Link to={step.to} className="btn btn-primary">
          <FormattedMessage id={step.label} />
        </Link>
      ) : (
        <Link to="/account" className="btn btn-outline-primary">
          <FormattedMessage id="secondPillarRejoin.notPermitted.backToAccountPage" />
        </Link>
      )}
    </>
  );
};
