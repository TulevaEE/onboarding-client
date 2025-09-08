import { PropsWithChildren, ReactNode, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import moment from 'moment';
import { FormattedMessage, useIntl } from 'react-intl';
import styles from './AddListing.module.scss';
import { formatAmountForCurrency, useNumberInput } from '../common/utils';
import { useCreateMemberCapitalListing, useMe } from '../common/apiHooks';
import { useMemberCapitalSum } from './hooks';
import { MemberCapitalListingType } from '../common/apiModels';
import { SaleOfTotalCapitalDescription } from './transfer/components/SaleOfTotalCapitalDescription';
import Slider from '../flows/withdrawals/Slider';
import { usePageTitle } from '../common/usePageTitle';

// TODO break up this component
export const AddListing = () => {
  usePageTitle('pageTitle.capitalListingNew');

  const history = useHistory();
  const { formatMessage } = useIntl();

  const [listingType, setListingType] = useState<MemberCapitalListingType>('BUY');

  const [expiryInMonths, setExpiryInMonths] = useState<number>(6);

  const totalPriceInput = useNumberInput();
  const bookValueInput = useNumberInput();

  const { mutateAsync: createListing, error } = useCreateMemberCapitalListing();

  const { bookValue: totalBookValue } = useMemberCapitalSum();

  const [submitting, setSubmitting] = useState(false);

  const errors = {
    noPriceValue:
      typeof totalPriceInput.value !== 'number' ||
      (typeof totalPriceInput.value === 'number' && totalPriceInput.value <= 0),
    noBookValue:
      typeof bookValueInput.value !== 'number' ||
      (typeof bookValueInput.value === 'number' && bookValueInput.value <= 0),
    moreThanMemberCapital:
      listingType === 'SELL' &&
      totalBookValue !== null &&
      totalBookValue < (bookValueInput.value ?? 0),
  };

  const handleSliderChange = (amount: number) => {
    bookValueInput.setInputValue(amount === 0 ? '' : amount.toFixed(2));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    if (bookValueInput.value === null || totalPriceInput.value === null) {
      return;
    }

    const expiryTime = moment().add(expiryInMonths, 'months').endOf('day').toISOString();

    try {
      await createListing({
        type: listingType,
        bookValue: bookValueInput.value,
        totalPrice: totalPriceInput.value,
        currency: 'EUR',
        expiryTime,
      });
      history.push('/capital/listings');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to create listing', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto d-flex flex-column gap-5">
      <div className="d-flex flex-column gap-4">
        <h1 className="m-0 text-center">Uus kuulutus</h1>
        <div className="btn-group d-flex px-0 px-sm-6 pb-4" role="group">
          <ListingButton
            listingType={listingType}
            listingTypeOfButton="BUY"
            onSetListingType={setListingType}
          >
            <FormattedMessage id="capital.listings.create.button.BUY" />
          </ListingButton>
          <ListingButton
            listingType={listingType}
            listingTypeOfButton="SELL"
            onSetListingType={setListingType}
          >
            <FormattedMessage id="capital.listings.create.button.SELL" />
          </ListingButton>
        </div>
      </div>

      <section className={`d-flex flex-column gap-5 ${styles.content}`}>
        {error && (
          <div className="alert alert-danger" role="alert">
            <FormattedMessage id="capital.listings.create.error" />
          </div>
        )}
        <div className="form-section d-flex flex-column gap-3">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 row-gap-2">
            <label htmlFor="book-value" className="fs-3 fw-semibold">
              <FormattedMessage id={`capital.listings.create.amountInput.label.${listingType}`} />
            </label>
            <div className={`input-group input-group-lg ${styles.inputGroup}`}>
              <input
                type="number"
                className={`form-control form-control-lg fw-semibold ${
                  errors.moreThanMemberCapital ? 'border-danger' : ''
                }`}
                id="book-value"
                placeholder="0"
                aria-label={formatMessage({
                  id: `capital.listings.create.amountInput.ariaLabel.${listingType}`,
                })}
                {...bookValueInput.inputProps}
              />
              <span className="input-group-text fw-semibold">&euro;</span>
            </div>
          </div>

          {listingType === 'SELL' && (
            <div className="d-flex flex-column gap-2">
              <Slider
                value={bookValueInput.value ?? 0}
                onChange={handleSliderChange}
                min={0}
                max={totalBookValue ?? 0}
                step={0.01}
                color="BLUE"
                ariaLabelledBy="book-value"
              />
              <div className="d-flex justify-content-between">
                <span className="text-body-secondary">{formatAmountForCurrency(0, 0)}</span>
                <span className="text-body-secondary">
                  {formatAmountForCurrency(totalBookValue ?? 0, 2)}
                </span>
              </div>
            </div>
          )}

          <div className="d-flex flex-column gap-2">
            {errors.moreThanMemberCapital && (
              <p className="m-0 text-danger">
                <FormattedMessage id="capital.listings.create.error.moreThanMemberCapital" />
              </p>
            )}
            <SaleOfTotalCapitalDescription
              type="LISTING"
              saleBookValueAmount={Math.max(bookValueInput.value ?? 0, 0)}
              transactionType={listingType}
            />
          </div>
        </div>

        <div className="form-section d-flex flex-column gap-3">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 row-gap-2">
            <label htmlFor="total-price" className="fs-3 fw-semibold">
              <FormattedMessage id={`capital.listings.create.priceInput.label.${listingType}`} />
            </label>
            <div className={`input-group input-group-lg ${styles.inputGroup}`}>
              <input
                placeholder="0"
                id="total-price"
                aria-label={formatMessage({ id: 'capital.listings.create.priceInput.ariaLabel' })}
                className="form-control form-control-lg fw-semibold"
                {...totalPriceInput.inputProps}
              />
              <span className="input-group-text fw-semibold">&euro;</span>
            </div>
          </div>
        </div>

        <div className="form-section d-flex flex-column gap-3">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 row-gap-2">
            <label htmlFor="expiry-select" className="fs-3 fw-semibold">
              <FormattedMessage id="capital.listings.create.expiryInput.label" />
            </label>
            <div className={`input-group input-group-lg ${styles.inputGroup}`}>
              <select
                value={expiryInMonths}
                onChange={(e) => setExpiryInMonths(Number(e.target.value))}
                className="form-select form-control-lg fw-semibold"
                placeholder="0"
                id="expiry-select"
                aria-label={formatMessage({ id: 'capital.listings.create.expiryInput.ariaLabel' })}
              >
                <option value="1">
                  {formatMessage({ id: 'capital.listings.create.expiryInput.value.1' })}
                </option>
                <option value="3">
                  {formatMessage({ id: 'capital.listings.create.expiryInput.value.3' })}
                </option>
                <option value="6">
                  {formatMessage({ id: 'capital.listings.create.expiryInput.value.6' })}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-5 border-top">
          <AssurancesSection />
        </div>

        <div className="d-flex flex-column-reverse flex-sm-row justify-content-between pt-4 border-top gap-3">
          <button type="button" className="btn btn-lg btn-light" onClick={() => history.goBack()}>
            <FormattedMessage id="capital.listings.details.button.back" />
          </button>
          <button
            type="button"
            className="btn btn-lg btn-primary"
            onClick={handleSubmit}
            disabled={
              submitting ||
              errors.moreThanMemberCapital ||
              errors.noBookValue ||
              errors.noPriceValue
            }
          >
            <FormattedMessage id={`capital.listings.create.submit.${listingType}`} />
          </button>
        </div>
      </section>
    </div>
  );
};

const AssurancesSection = () => {
  const { data: user } = useMe();

  return (
    <ul className="d-flex flex-column row-gap-3 list-unstyled m-0">
      <AssuranceItem
        svg={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="align-top"
            viewBox="0 0 16 16"
          >
            <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1zm13 2.383-4.708 2.825L15 11.105zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741M1 11.105l4.708-2.897L1 5.383z" />
          </svg>
        }
      >
        <FormattedMessage id="capital.listings.create.contactDetails" />
        <br />
        {user?.email}{' '}
        <span className="text-secondary">
          (
          <Link to="/contact-details">
            <FormattedMessage id="capital.listings.create.contactDetails.update" />
          </Link>
          )
        </span>
      </AssuranceItem>

      <AssuranceItem
        svg={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="align-top"
            viewBox="0 0 16 16"
          >
            <path d="M5.338 1.59a61 61 0 0 0-2.837.856.48.48 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.7 10.7 0 0 0 2.287 2.233c.346.244.652.42.893.533q.18.085.293.118a1 1 0 0 0 .101.025 1 1 0 0 0 .1-.025q.114-.034.294-.118c.24-.113.547-.29.893-.533a10.7 10.7 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524zM5.072.56C6.157.265 7.31 0 8 0s1.843.265 2.928.56c1.11.3 2.229.655 2.887.87a1.54 1.54 0 0 1 1.044 1.262c.596 4.477-.787 7.795-2.465 9.99a11.8 11.8 0 0 1-2.517 2.453 7 7 0 0 1-1.048.625c-.28.132-.581.24-.829.24s-.548-.108-.829-.24a7 7 0 0 1-1.048-.625 11.8 11.8 0 0 1-2.517-2.453C1.928 10.487.545 7.169 1.141 2.692A1.54 1.54 0 0 1 2.185 1.43 63 63 0 0 1 5.072.56" />
            <path d="M10.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0" />
          </svg>
        }
      >
        <FormattedMessage id="capital.listings.create.assurance.nameEmailPrivacy" />
      </AssuranceItem>

      <AssuranceItem
        svg={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="align-top"
            viewBox="0 0 16 16"
          >
            <path d="M15 8a6.97 6.97 0 0 0-1.71-4.584l-9.874 9.875A7 7 0 0 0 15 8M2.71 12.584l9.874-9.875a7 7 0 0 0-9.874 9.874ZM16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0" />
          </svg>
        }
      >
        <FormattedMessage id="capital.listings.create.assurance.noFees" />
      </AssuranceItem>
    </ul>
  );
};

const AssuranceItem = ({ children, svg }: PropsWithChildren<{ svg: ReactNode }>) => (
  <li className="d-flex gap-2 align-items-start">
    <span aria-hidden="true" className="mt-1 me-1">
      {svg}
    </span>
    <span>{children}</span>
  </li>
);

const ListingButton = ({
  children,
  listingType,
  listingTypeOfButton,
  onSetListingType,
}: PropsWithChildren<{
  listingType: MemberCapitalListingType;
  listingTypeOfButton: MemberCapitalListingType;
  onSetListingType: (listingTypeOfButton: MemberCapitalListingType) => unknown;
}>) => (
  <button
    type="button"
    onClick={() => onSetListingType(listingTypeOfButton)}
    className={`btn ${listingType === listingTypeOfButton ? 'btn-primary' : `btn-light`}`}
  >
    {children}
  </button>
);
