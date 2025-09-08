import { PropsWithChildren } from 'react';
import { formatAmountForCurrency, getFullName } from '../../../common/utils';
import { TransferAmountBreakdown } from './TransferAmountBreakdown';
import { getTotalBookValue } from '../status/utils';
import { ContractDetailsProps, ContractStatusProgress } from '../create/types';
import { formatDateYear } from '../../../common/dateFormatter';
import { getBankName } from '../../../common/iban';

export const ContractDetails = ({
  seller,
  buyer,
  userRole,
  amounts,
  totalPrice,
  sellerIban,
  progress,
  creationDate,
}: ContractDetailsProps) => (
  <div className="d-flex flex-column gap-4">
    <div className="d-flex flex-column flex-sm-row row-gap-3 pb-4 border-bottom">
      <div className="col d-flex flex-column gap-2" data-testid="seller-details">
        <b>Müüja</b>
        <div>
          <div className="fs-3">{getFullName(seller)}</div>
          <div className="text-secondary">{seller.personalCode}</div>
        </div>
        {progress && <SellerProgressContainer progress={progress} userRole={userRole} />}
      </div>
      <div className="col d-flex flex-column gap-2" data-testid="buyer-details">
        <b>Ostja</b>
        <div>
          <div className="fs-3">{getFullName(buyer)}</div>
          <div className="text-secondary">{buyer.personalCode}</div>
        </div>
        {progress && <BuyerProgressContainer progress={progress} userRole={userRole} />}
      </div>
    </div>

    <TransferAmountBreakdown
      amounts={amounts}
      totalBookValue={getTotalBookValue({ transferAmounts: amounts })}
    />

    <div className="d-flex pb-4 border-bottom">
      <div className="col">
        <b>Hinnaga</b>
      </div>
      <div className="col">
        <b>{formatAmountForCurrency(totalPrice)}</b>
      </div>
    </div>

    <div className="d-flex flex-column flex-sm-row">
      <div className="col d-flex justify-content-between">
        <b>Müüja pangakonto (IBAN)</b>
      </div>
      <div className="col">
        {sellerIban}
        <div className="text-secondary">{getBankName(sellerIban)}</div>
      </div>
    </div>

    {creationDate && (
      <div className="d-flex flex-column flex-sm-row">
        <div className="col">
          <b>Avalduse kuupäev</b>
        </div>
        <div className="col">{formatDateYear(creationDate)}</div>
      </div>
    )}
  </div>
);

const BuyerProgressContainer = ({
  progress,
  userRole,
}: {
  progress: ContractStatusProgress;
  userRole: 'BUYER' | 'SELLER';
}) => {
  const waitingForSignatureText =
    userRole === 'BUYER' ? 'Sinu allkirja ootel' : 'Ostja allkirja ootel';

  return (
    <>
      <ProgressStep status={progress.signed.buyer}>
        {progress.signed.buyer ? 'Allkirjastatud' : waitingForSignatureText}
      </ProgressStep>
      {progress.signed.seller && progress.signed.buyer && (
        <ProgressStep status={progress.confirmed.buyer}>
          {progress.confirmed.buyer ? 'Makse teostatud' : 'Makse ootel'}
        </ProgressStep>
      )}
    </>
  );
};

const SellerProgressContainer = ({
  progress,
  userRole,
}: {
  progress: ContractStatusProgress;
  userRole: 'BUYER' | 'SELLER';
}) => {
  const waitingForSignatureText =
    userRole === 'SELLER' ? 'Sinu allkirja ootel' : 'Müüja allkirja ootel';

  return (
    <>
      <ProgressStep status={progress.signed.seller}>
        {progress.signed.seller ? 'Allkirjastatud' : waitingForSignatureText}
      </ProgressStep>
      {progress.signed.seller && progress.signed.buyer && progress.confirmed.buyer && (
        <ProgressStep status={progress.confirmed.seller}>
          {progress.confirmed.seller ? 'Raha laekunud' : 'Raha laekumise ootel'}
        </ProgressStep>
      )}
    </>
  );
};

const ProgressStep = ({ status, children }: PropsWithChildren<{ status: boolean }>) => {
  if (!status) {
    return (
      <div className="d-flex align-items-center gap-1 text-danger">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z" />
        </svg>
        <b>{children}</b>
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center gap-1 text-success">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        viewBox="0 0 16 16"
        aria-hidden="true"
      >
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z" />
      </svg>
      <b>{children}</b>
    </div>
  );
};
