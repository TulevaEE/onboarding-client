import { PropsWithChildren } from 'react';
import { formatAmountForCurrency, getFullName } from '../../../common/utils';
import { TransferAmountBreakdown } from './TransferAmountBreakdown';
import { getTotalBookValue } from '../status/utils';
import { ContractDetailsProps, ContractStatusProgress } from '../create/types';

export const ContractDetails = ({
  seller,
  buyer,
  userRole,
  amounts,
  totalPrice,
  sellerIban,
  progress,
}: ContractDetailsProps) => (
  <div className="d-flex flex-column gap-4">
    <div className="d-flex flex-column flex-sm-row row-gap-3 pb-4 border-bottom">
      <div className="col" data-testid="seller-details">
        <b>Müüja</b>
        <div className="fs-3">{getFullName(seller)}</div>
        <div className="text-secondary">{seller.personalCode}</div>
        {progress && <SellerProgressContainer progress={progress} userRole={userRole} />}
      </div>
      <div className="col" data-testid="buyer-details">
        <b>Ostja</b>
        <div className="fs-3">{getFullName(buyer)}</div>
        <div className="text-secondary">{buyer.personalCode}</div>
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
      <div className="col">
        <b>Müüja pangakonto (IBAN)</b>
      </div>
      <div className="col">{sellerIban}</div>
    </div>
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
      <div>
        <ProgressStep status={progress.signed.buyer}>
          {progress.signed.buyer ? 'Allkirjastatud' : waitingForSignatureText}
        </ProgressStep>
      </div>
      {progress.signed.seller && progress.signed.buyer && (
        <div>
          <ProgressStep status={progress.confirmed.buyer}>
            {progress.confirmed.buyer ? 'Makse teostatud' : 'Makse ootel'}
          </ProgressStep>
        </div>
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
      <div>
        <ProgressStep status={progress.signed.seller}>
          {progress.signed.seller ? 'Allkirjastatud' : waitingForSignatureText}
        </ProgressStep>
      </div>
      {progress.signed.seller && progress.signed.buyer && progress.confirmed.buyer && (
        <div>
          <ProgressStep status={progress.confirmed.seller}>
            {progress.confirmed.seller ? 'Makse teostatud' : 'Maksekinnituse ootel'}
          </ProgressStep>
        </div>
      )}
    </>
  );
};

const ProgressStep = ({ status, children }: PropsWithChildren<{ status: boolean }>) => {
  if (!status) {
    return (
      <div className="d-flex align-items-center py-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <g clipPath="url(#clip0_3919_7673)">
            <path
              d="M16 8C16 10.1217 15.1571 12.1566 13.6569 13.6569C12.1566 15.1571 10.1217 16 8 16C5.87827 16 3.84344 15.1571 2.34315 13.6569C0.842855 12.1566 0 10.1217 0 8C0 5.87827 0.842855 3.84344 2.34315 2.34315C3.84344 0.842855 5.87827 0 8 0C10.1217 0 12.1566 0.842855 13.6569 2.34315C15.1571 3.84344 16 5.87827 16 8ZM8 3.5C8 3.36739 7.94732 3.24021 7.85355 3.14645C7.75979 3.05268 7.63261 3 7.5 3C7.36739 3 7.24021 3.05268 7.14645 3.14645C7.05268 3.24021 7 3.36739 7 3.5V9C7.00003 9.08813 7.02335 9.17469 7.06761 9.25091C7.11186 9.32712 7.17547 9.39029 7.252 9.434L10.752 11.434C10.8669 11.4961 11.0014 11.5108 11.127 11.4749C11.2525 11.4391 11.3591 11.3556 11.4238 11.2422C11.4886 11.1288 11.5065 10.9946 11.4736 10.8683C11.4408 10.7419 11.3598 10.6334 11.248 10.566L8 8.71V3.5Z"
              fill="#DB2200"
            />
          </g>
          <defs>
            <clipPath id="clip0_3919_7673">
              <rect width="16" height="16" fill="white" />
            </clipPath>
          </defs>
        </svg>
        <b className="ms-1 text-danger">{children}</b>
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center py-1">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
      >
        <g clipPath="url(#clip0_3919_7663)">
          <path
            d="M16 8C16 10.1217 15.1571 12.1566 13.6569 13.6569C12.1566 15.1571 10.1217 16 8 16C5.87827 16 3.84344 15.1571 2.34315 13.6569C0.842855 12.1566 0 10.1217 0 8C0 5.87827 0.842855 3.84344 2.34315 2.34315C3.84344 0.842855 5.87827 0 8 0C10.1217 0 12.1566 0.842855 13.6569 2.34315C15.1571 3.84344 16 5.87827 16 8ZM12.03 4.97C11.9586 4.89882 11.8735 4.84277 11.7799 4.80522C11.6863 4.76766 11.5861 4.74936 11.4853 4.75141C11.3845 4.75347 11.2851 4.77583 11.1932 4.81717C11.1012 4.85851 11.0185 4.91797 10.95 4.992L7.477 9.417L5.384 7.323C5.24183 7.19052 5.05378 7.1184 4.85948 7.12183C4.66518 7.12525 4.47979 7.20397 4.34238 7.34138C4.20497 7.47879 4.12625 7.66418 4.12283 7.85848C4.1194 8.05278 4.19152 8.24083 4.324 8.383L6.97 11.03C7.04128 11.1012 7.12616 11.1572 7.21958 11.1949C7.313 11.2325 7.41305 11.2509 7.51375 11.2491C7.61444 11.2472 7.71374 11.2251 7.8057 11.184C7.89766 11.1429 7.9804 11.0837 8.049 11.01L12.041 6.02C12.1771 5.8785 12.2523 5.68928 12.2504 5.49296C12.2485 5.29664 12.1698 5.10888 12.031 4.97H12.03Z"
            fill="#008300"
          />
        </g>
        <defs>
          <clipPath id="clip0_3919_7663">
            <rect width="16" height="16" fill="white" />
          </clipPath>
        </defs>
      </svg>
      <b className="ms-1 text-success">{children}</b>
    </div>
  );
};
