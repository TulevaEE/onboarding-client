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
    <div className="col-12 col-md-11 col-lg-8 mx-auto d-flex flex-column gap-5">
      <h1 className="m-0 text-center">
        <FormattedMessage id={`capital.listings.details.heading.messageTo.${listing.type}`} />
      </h1>

      <div className="d-flex flex-column gap-5">
        {isDifferentLanguage && (
          <div className="alert alert-primary d-flex align-items-top gap-2 m-0" role="alert">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
              className="flex-shrink-0 mt-1"
              aria-hidden="true"
            >
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
              <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
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
            <div className="card p-3 bg-gray-1" dangerouslySetInnerHTML={{ __html: message }} />
          )}
        </div>

        <div className="d-flex flex-column gap-2">
          <p className="m-0">
            <strong className="form-label">Sinu kontaktandmed</strong>{' '}
            <span className="text-secondary">
              (
              <Link
                to={{
                  pathname: '/contact-details',
                  state: { from: `/capital/listings/${listing.id}` },
                }}
              >
                uuendan
              </Link>
              )
            </span>
          </p>
          <div className="form-check m-0">
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
          <div className="form-check m-0">
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
        </div>
      </div>
      <div className="d-flex flex-column-reverse flex-sm-row justify-content-between pt-4 border-top gap-3">
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
    </div>
  );
};
