import { Link } from 'react-router-dom';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import styles from './ListingsList.module.scss';
import { useDeleteMemberCapitalListing, useMemberCapitalListings } from '../../common/apiHooks';
import Loader from '../../common/loader';
import { MemberCapitalListing } from '../../common/apiModels';
import { formatAmountForCurrency } from '../../common/utils';
import { formatDateYear } from '../../common/dateFormatter';

export const ListingsList = () => {
  const { data: listings } = useMemberCapitalListings();

  if (!listings) {
    return <Loader className="align-middle" />;
  }

  if (listings.length === 0) {
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
          {listings.map((listing) => (
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
          <div className="dropdown">
            <button
              type="button"
              className="btn btn-link p-0 border-0 d-inline-flex align-items-center gap-1 align-top"
              aria-expanded={deleteDropdownOpen}
              onClick={() => setDeleteDropdownOpen((oldVal) => !oldVal)}
            >
              {deleteDropdownOpen ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M8 15C6.14348 15 4.36301 14.2625 3.05025 12.9497C1.7375 11.637 1 9.85652 1 8C1 6.14348 1.7375 4.36301 3.05025 3.05025C4.36301 1.7375 6.14348 1 8 1C9.85652 1 11.637 1.7375 12.9497 3.05025C14.2625 4.36301 15 6.14348 15 8C15 9.85652 14.2625 11.637 12.9497 12.9497C11.637 14.2625 9.85652 15 8 15ZM8 16C10.1217 16 12.1566 15.1571 13.6569 13.6569C15.1571 12.1566 16 10.1217 16 8C16 5.87827 15.1571 3.84344 13.6569 2.34315C12.1566 0.842855 10.1217 0 8 0C5.87827 0 3.84344 0.842855 2.34315 2.34315C0.842855 3.84344 0 5.87827 0 8C0 10.1217 0.842855 12.1566 2.34315 13.6569C3.84344 15.1571 5.87827 16 8 16Z" />
                    <path d="M4.64689 4.64689C4.69334 4.60033 4.74851 4.56339 4.80926 4.53818C4.87001 4.51297 4.93513 4.5 5.00089 4.5C5.06666 4.5 5.13178 4.51297 5.19253 4.53818C5.25327 4.56339 5.30845 4.60033 5.35489 4.64689L8.00089 7.29389L10.6469 4.64689C10.6934 4.60041 10.7486 4.56353 10.8093 4.53837C10.87 4.51321 10.9351 4.50026 11.0009 4.50026C11.0666 4.50026 11.1317 4.51321 11.1925 4.53837C11.2532 4.56353 11.3084 4.60041 11.3549 4.64689C11.4014 4.69338 11.4383 4.74857 11.4634 4.80931C11.4886 4.87005 11.5015 4.93515 11.5015 5.00089C11.5015 5.06664 11.4886 5.13174 11.4634 5.19248C11.4383 5.25322 11.4014 5.30841 11.3549 5.35489L8.70789 8.00089L11.3549 10.6469C11.4014 10.6934 11.4383 10.7486 11.4634 10.8093C11.4886 10.87 11.5015 10.9351 11.5015 11.0009C11.5015 11.0666 11.4886 11.1317 11.4634 11.1925C11.4383 11.2532 11.4014 11.3084 11.3549 11.3549C11.3084 11.4014 11.2532 11.4383 11.1925 11.4634C11.1317 11.4886 11.0666 11.5015 11.0009 11.5015C10.9351 11.5015 10.87 11.4886 10.8093 11.4634C10.7486 11.4383 10.6934 11.4014 10.6469 11.3549L8.00089 8.70789L5.35489 11.3549C5.30841 11.4014 5.25322 11.4383 5.19248 11.4634C5.13174 11.4886 5.06664 11.5015 5.00089 11.5015C4.93515 11.5015 4.87005 11.4886 4.80931 11.4634C4.74857 11.4383 4.69338 11.4014 4.64689 11.3549C4.60041 11.3084 4.56353 11.2532 4.53837 11.1925C4.51321 11.1317 4.50026 11.0666 4.50026 11.0009C4.50026 10.9351 4.51321 10.87 4.53837 10.8093C4.56353 10.7486 4.60041 10.6934 4.64689 10.6469L7.29389 8.00089L4.64689 5.35489C4.60033 5.30845 4.56339 5.25327 4.53818 5.19253C4.51297 5.13178 4.5 5.06666 4.5 5.00089C4.5 4.93513 4.51297 4.87001 4.53818 4.80926C4.56339 4.74851 4.60033 4.69334 4.64689 4.64689Z" />
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
