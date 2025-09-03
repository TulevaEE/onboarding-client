import { Link, useHistory, useParams } from 'react-router-dom';
import { useState } from 'react';
import config from 'react-global-configuration';
import { FormattedMessage } from 'react-intl';
import {
  useContactMemberCapitalListing,
  useMe,
  useMemberCapitalListings,
  usePreviewMemberCapitalListingMessage,
} from '../common/apiHooks';
import { Loader } from '../common';
import styles from './ListingDetails.module.scss';
import { SuccessAlert } from '../common/successAlert';

export const ListingDetails = () => {
  const { id: urlId } = useParams<{ id: string }>();

  const { data: listings } = useMemberCapitalListings();
  const {
    mutateAsync: sendMessageRequest,
    isLoading: sending,
    error,
  } = useContactMemberCapitalListing();
  const { data: me } = useMe();

  const [success, setSuccess] = useState(false);

  const [addPhoneNumber, setAddPhoneNumber] = useState(false);
  const [addPersonalCode, setAddPersonalCode] = useState(false);

  const { data: message, isLoading: isLoadingPreview } = usePreviewMemberCapitalListingMessage({
    id: Number(urlId),
    addPersonalCode,
    addPhoneNumber,
  });

  const history = useHistory();

  const listing = listings?.find((otherListing) => otherListing.id === Number(urlId));

  const handleContactButtonClicked = async () => {
    if (!listing || !message) {
      return;
    }

    await sendMessageRequest({ addPersonalCode, addPhoneNumber, id: listing?.id });
    setSuccess(true);
  };

  if (!listings || !me) {
    return <Loader className="align-middle" />;
  }

  if (!listing) {
    return (
      <div className="col-12 col-md-11 col-lg-9 mx-auto">
        <div className="my-5">
          <div className="alert alert-warning" role="alert">
            <FormattedMessage id="capital.listings.details.notFound" />
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <SuccessAlert>
        <h2 className="py-2">
          <FormattedMessage id="capital.listings.details.success.title" />
        </h2>

        <div className="pb-2">
          <FormattedMessage id="capital.listings.details.success.info" />
        </div>

        <button
          type="button"
          className="btn btn-outline-primary my-3"
          onClick={() => {
            history.push(`/capital/listings/`);
          }}
        >
          <FormattedMessage id="capital.listings.details.success.backToListings" />
        </button>
      </SuccessAlert>
    );
  }

  /* if (listing.isOwnListing) {
    return <Redirect to="/capital/listings/" />;
  } */

  const isDifferentLanguage = config.get('language') !== listing.language;

  return (
    <div className="col-12 col-md-11 col-lg-10 mx-auto">
      <div className="my-5">
        <h1 className="mb-4 text-center">
          <FormattedMessage id={`capital.listings.details.heading.messageTo.${listing.type}`} />
        </h1>
      </div>

      <section className={styles.listingDetailsContainer}>
        {isDifferentLanguage && (
          <div className="alert alert-info d-flex" role="alert">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="me-2 mt-1"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <g clipPath="url(#clip0_3687_5210)">
                <path
                  d="M8 15C6.14348 15 4.36301 14.2625 3.05025 12.9497C1.7375 11.637 1 9.85652 1 8C1 6.14348 1.7375 4.36301 3.05025 3.05025C4.36301 1.7375 6.14348 1 8 1C9.85652 1 11.637 1.7375 12.9497 3.05025C14.2625 4.36301 15 6.14348 15 8C15 9.85652 14.2625 11.637 12.9497 12.9497C11.637 14.2625 9.85652 15 8 15ZM8 16C10.1217 16 12.1566 15.1571 13.6569 13.6569C15.1571 12.1566 16 10.1217 16 8C16 5.87827 15.1571 3.84344 13.6569 2.34315C12.1566 0.842855 10.1217 0 8 0C5.87827 0 3.84344 0.842855 2.34315 2.34315C0.842855 3.84344 0 5.87827 0 8C0 10.1217 0.842855 12.1566 2.34315 13.6569C3.84344 15.1571 5.87827 16 8 16Z"
                  fill="#002F63"
                />
                <path
                  d="M8.92995 6.588L6.63995 6.875L6.55795 7.255L7.00795 7.338C7.30195 7.408 7.35995 7.514 7.29595 7.807L6.55795 11.275C6.36395 12.172 6.66295 12.594 7.36595 12.594C7.91095 12.594 8.54395 12.342 8.83095 11.996L8.91895 11.58C8.71895 11.756 8.42695 11.826 8.23295 11.826C7.95795 11.826 7.85795 11.633 7.92895 11.293L8.92995 6.588ZM8.99995 4.5C8.99995 4.76522 8.8946 5.01957 8.70706 5.20711C8.51952 5.39464 8.26517 5.5 7.99995 5.5C7.73474 5.5 7.48038 5.39464 7.29285 5.20711C7.10531 5.01957 6.99995 4.76522 6.99995 4.5C6.99995 4.23478 7.10531 3.98043 7.29285 3.79289C7.48038 3.60536 7.73474 3.5 7.99995 3.5C8.26517 3.5 8.51952 3.60536 8.70706 3.79289C8.8946 3.98043 8.99995 4.23478 8.99995 4.5Z"
                  fill="#002F63"
                />
              </g>
              <defs>
                <clipPath id="clip0_3687_5210">
                  <rect width="16" height="16" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <FormattedMessage id="capital.listings.details.differentLanguage.info" />
          </div>
        )}
        {error && (
          <div className="alert alert-warning" role="alert">
            <FormattedMessage id="capital.listings.details.messsage.error" />
          </div>
        )}
        <div>
          <label htmlFor="unit-amount" className="form-label">
            <FormattedMessage id={`capital.listings.details.label.message.${listing.type}`} />
          </label>
          {!message || isLoadingPreview ? (
            <div className="pt-5">
              <Loader className={`align-middle ${styles.listingLoader}`} />
            </div>
          ) : (
            // eslint-disable-next-line react/no-danger
            <div className="card mt-1 p-3" dangerouslySetInnerHTML={{ __html: message }} />
          )}
        </div>

        <div className="form-check mt-3">
          <input
            checked={addPhoneNumber}
            onChange={() => setAddPhoneNumber(!addPhoneNumber)}
            type="checkbox"
            className="form-check-input"
            id="add-phone-checkbox"
          />
          <label className="form-check-label" htmlFor="add-phone-checkbox">
            Avaldan oma telefoninumbri: {me.phoneNumber}
          </label>
        </div>

        <div className="form-check mt-2">
          <input
            checked={addPersonalCode}
            onChange={() => setAddPersonalCode(!addPersonalCode)}
            type="checkbox"
            className="form-check-input"
            id="add-personal-code-checkbox"
          />
          <label className="form-check-label" htmlFor="add-personal-code-checkbox">
            Avaldan oma isikukoodi: {me.personalCode}
          </label>
          <div className="text-secondary">
            Müüjalt küsitakse sinu isikukoodi liikmekapitali võõrandamise avaldusel
          </div>
        </div>

        <div className="pt-3">
          <div>
            <Link
              to={{
                pathname: '/contact-details',
                state: { from: `/capital/listings/${listing.id}` },
              }}
            >
              Soovid uuendada oma kontaktandmeid?
            </Link>
          </div>
        </div>

        <div className="d-flex justify-content-between mt-4 pt-4 border-top">
          <button type="button" className="btn btn-lg btn-light" onClick={() => history.goBack()}>
            <FormattedMessage id="capital.listings.details.button.back" />
          </button>
          <button
            type="button"
            className="btn btn-lg btn-primary"
            disabled={sending || isLoadingPreview}
            onClick={handleContactButtonClicked}
          >
            <FormattedMessage id={`capital.listings.details.button.sendTo.${listing.type}`} />
          </button>
        </div>
      </section>
    </div>
  );
};
