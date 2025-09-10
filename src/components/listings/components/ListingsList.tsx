import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import styles from './ListingsList.module.scss';
import { useDeleteMemberCapitalListing, useMemberCapitalListings } from '../../common/apiHooks';
import Loader from '../../common/loader';
import { MemberCapitalListing } from '../../common/apiModels';
import { formatAmountForCurrency } from '../../common/utils';
import { formatDateYear } from '../../common/dateFormatter';

const sortListings = (listingA: MemberCapitalListing, listingB: MemberCapitalListing) => {
  if (listingA.type === 'BUY') {
    if (listingB.type === 'SELL') {
      return -1;
    }

    return listingB.bookValue - listingA.bookValue;
  }

  if (listingB.type === 'BUY') {
    if (listingA.type === 'SELL') {
      return 1;
    }

    return listingB.bookValue - listingA.bookValue;
  }

  return 0;
};

export const ListingsList = () => {
  const { data: listings } = useMemberCapitalListings();
  const sortedListings = useMemo(() => listings?.sort(sortListings), [listings]);

  if (!sortedListings) {
    return <Loader className="align-middle" />;
  }

  if (sortedListings.length === 0) {
    return (
      <div className={styles.noListingsContainer}>
        <div className="text-secondary">
          <FormattedMessage id="capital.listings.noListings" />
        </div>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table m-0 text-nowrap">
        <TableHeader />
        <tbody>
          {sortedListings.map((listing) => (
            <ListingRow key={listing.id} listing={listing} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TableHeader = () => (
  <thead>
    <tr>
      <th scope="col">
        <FormattedMessage id="capital.listings.header.listing" />
      </th>
      <th scope="col">
        <FormattedMessage id="capital.listings.header.value" />
      </th>
      <th scope="col">
        <FormattedMessage id="capital.listings.header.totalPrice" />
      </th>
      <th scope="col " className="w-20 text-start text-nowrap">
        <FormattedMessage id="capital.listings.header.action" />
      </th>
    </tr>
  </thead>
);

const ListingRow = ({ listing }: { listing: MemberCapitalListing }) => {
  const [deleteDropdownOpen, setDeleteDropdownOpen] = useState(false);

  const { mutateAsync: deleteListing, error } = useDeleteMemberCapitalListing();

  const handleDeleteSubmit = async () => {
    await deleteListing(listing);
    setDeleteDropdownOpen(false);
  };
  return (
    <tr data-testid="listing">
      <td>
        {listing.type === 'BUY' ? (
          <FormattedMessage id="capital.listings.type.buy" />
        ) : (
          <FormattedMessage id="capital.listings.type.sell" />
        )}{' '}
        <span className="text-secondary">#{listing.id}</span>
      </td>
      <td>{formatAmountForCurrency(listing.bookValue)}</td>
      <td>{formatAmountForCurrency(listing.totalPrice)}</td>
      <td className="text-start text-nowrap">
        {listing.isOwnListing && (
          <div className="dropdown d-inline-block">
            <button
              type="button"
              className="btn btn-link p-0 border-0 d-inline-flex align-items-center gap-1 align-top"
              aria-expanded={deleteDropdownOpen}
              onClick={() => setDeleteDropdownOpen((oldVal) => !oldVal)}
              data-bs-display="static"
            >
              {deleteDropdownOpen ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                  </svg>

                  <FormattedMessage id="capital.listings.action.delete.cancel" />
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5" />
                  </svg>
                  <FormattedMessage id="capital.listings.action.delete" />
                </>
              )}
            </button>
            <div
              className={`dropdown-menu dropdown-menu-end p-4 shadow ${styles.deletionDropdown} ${
                deleteDropdownOpen ? 'show' : ''
              }`}
              data-bs-popper="static"
            >
              <b>
                <FormattedMessage id="capital.listings.action.delete.confirmTitle" />
              </b>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <FormattedMessage id="capital.listings.action.delete.error" />
                </div>
              )}
              <div className="text-secondary">
                <FormattedMessage
                  id="capital.listings.action.delete.expiry"
                  values={{ date: formatDateYear(listing.expiryTime) }}
                />
              </div>

              <div className="pt-3">
                <button className="btn btn-primary me-2" type="button" onClick={handleDeleteSubmit}>
                  <FormattedMessage id="capital.listings.action.delete.confirm" />
                </button>
                <button
                  className="btn btn-light"
                  type="button"
                  onClick={() => setDeleteDropdownOpen(false)}
                >
                  <FormattedMessage id="capital.listings.action.delete.cancel" />
                </button>
              </div>
            </div>
          </div>
        )}
        {!listing.isOwnListing && (
          <Link to={`/capital/listings/${listing.id}`} className="icon-link align-top">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1zm13 2.383-4.708 2.825L15 11.105zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741M1 11.105l4.708-2.897L1 5.383z" />
            </svg>
            <FormattedMessage id={`capital.listings.wantTo.forListing.${listing.type}`} />
          </Link>
        )}
      </td>
    </tr>
  );
};
