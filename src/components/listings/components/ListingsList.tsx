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
    <div className="table-container">
      <table className="table">
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
      <th scope="col">TODO Maht</th>
      <th scope="col">Hind</th>
      <th scope="col">
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
      <td>
        {listing.isOwnListing && (
          <div className="dropdown">
            <button
              type="button"
              className="btn btn-link p-0 d-inline-flex align-items-center"
              aria-expanded={deleteDropdownOpen}
              onClick={() => setDeleteDropdownOpen((oldVal) => !oldVal)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="16"
                viewBox="0 0 14 16"
                className="me-1"
                fill="none"
              >
                <path
                  d="M5.5 1H8.5C8.63261 1 8.75979 1.05268 8.85355 1.14645C8.94732 1.24021 9 1.36739 9 1.5V2.5H5V1.5C5 1.36739 5.05268 1.24021 5.14645 1.14645C5.24021 1.05268 5.36739 1 5.5 1ZM10 2.5V1.5C10 1.10218 9.84196 0.720644 9.56066 0.43934C9.27936 0.158035 8.89782 0 8.5 0L5.5 0C5.10218 0 4.72064 0.158035 4.43934 0.43934C4.15804 0.720644 4 1.10218 4 1.5V2.5H0.5C0.367392 2.5 0.240215 2.55268 0.146447 2.64645C0.0526784 2.74021 0 2.86739 0 3C0 3.13261 0.0526784 3.25979 0.146447 3.35355C0.240215 3.44732 0.367392 3.5 0.5 3.5H1.038L1.891 14.16C1.93122 14.6612 2.15875 15.1289 2.52827 15.4698C2.8978 15.8108 3.38219 16.0001 3.885 16H10.115C10.6178 16.0001 11.1022 15.8108 11.4717 15.4698C11.8412 15.1289 12.0688 14.6612 12.109 14.16L12.962 3.5H13.5C13.6326 3.5 13.7598 3.44732 13.8536 3.35355C13.9473 3.25979 14 3.13261 14 3C14 2.86739 13.9473 2.74021 13.8536 2.64645C13.7598 2.55268 13.6326 2.5 13.5 2.5H10ZM11.958 3.5L11.112 14.08C11.0919 14.3306 10.9781 14.5644 10.7934 14.7349C10.6086 14.9054 10.3664 15.0001 10.115 15H3.885C3.6336 15.0001 3.3914 14.9054 3.20664 14.7349C3.02188 14.5644 2.90811 14.3306 2.888 14.08L2.042 3.5H11.958ZM4.471 4.5C4.60333 4.49235 4.73329 4.53756 4.8323 4.6257C4.93131 4.71383 4.99127 4.83767 4.999 4.97L5.499 13.47C5.50425 13.6008 5.45802 13.7284 5.37022 13.8255C5.28242 13.9225 5.16006 13.9813 5.02941 13.9892C4.89876 13.997 4.77024 13.9533 4.67144 13.8675C4.57265 13.7816 4.51145 13.6605 4.501 13.53L4 5.03C3.99594 4.96431 4.00489 4.89847 4.02633 4.83625C4.04777 4.77403 4.08129 4.71665 4.12495 4.66741C4.16862 4.61817 4.22158 4.57804 4.28079 4.54931C4.34 4.52058 4.4043 4.50382 4.47 4.5H4.471ZM9.529 4.5C9.5947 4.50382 9.659 4.52058 9.71821 4.54931C9.77742 4.57804 9.83038 4.61817 9.87405 4.66741C9.91771 4.71665 9.95123 4.77403 9.97267 4.83625C9.99411 4.89847 10.0031 4.96431 9.999 5.03L9.499 13.53C9.49633 13.5964 9.48044 13.6617 9.45224 13.7219C9.42405 13.7821 9.38413 13.8361 9.33481 13.8807C9.28549 13.9254 9.22777 13.9597 9.16503 13.9817C9.10228 14.0037 9.03578 14.013 8.9694 14.009C8.90302 14.005 8.8381 13.9878 8.77845 13.9585C8.7188 13.9291 8.6656 13.8881 8.62199 13.8379C8.57837 13.7877 8.5452 13.7293 8.52443 13.6661C8.50365 13.603 8.49569 13.5363 8.501 13.47L9.001 4.97C9.00873 4.83767 9.06869 4.71383 9.1677 4.6257C9.26671 4.53756 9.39667 4.49235 9.529 4.5ZM7 4.5C7.13261 4.5 7.25979 4.55268 7.35355 4.64645C7.44732 4.74021 7.5 4.86739 7.5 5V13.5C7.5 13.6326 7.44732 13.7598 7.35355 13.8536C7.25979 13.9473 7.13261 14 7 14C6.86739 14 6.74021 13.9473 6.64645 13.8536C6.55268 13.7598 6.5 13.6326 6.5 13.5V5C6.5 4.86739 6.55268 4.74021 6.64645 4.64645C6.74021 4.55268 6.86739 4.5 7 4.5Z"
                  fill="#006CE6"
                />
              </svg>
              <FormattedMessage id="capital.listings.action.delete" />
            </button>
            <div
              className={`dropdown-menu p-4 ${styles.deletionDropdown} ${
                deleteDropdownOpen ? 'show' : ''
              }`}
            >
              <b>
                <FormattedMessage id="capital.listings.action.delete.confirmTitle" />
              </b>

              {error && (
                <div className="alert alert-danger">
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
          <Link
            to={`/capital/listings/${listing.id}`}
            className="d-flex align-items-center justify-content-end"
          >
            <svg
              className="me-2"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 4C0 3.46957 0.210714 2.96086 0.585786 2.58579C0.960859 2.21071 1.46957 2 2 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V12C16 12.5304 15.7893 13.0391 15.4142 13.4142C15.0391 13.7893 14.5304 14 14 14H2C1.46957 14 0.960859 13.7893 0.585786 13.4142C0.210714 13.0391 0 12.5304 0 12V4ZM2 3C1.73478 3 1.48043 3.10536 1.29289 3.29289C1.10536 3.48043 1 3.73478 1 4V4.217L8 8.417L15 4.217V4C15 3.73478 14.8946 3.48043 14.7071 3.29289C14.5196 3.10536 14.2652 3 14 3H2ZM15 5.383L10.292 8.208L15 11.105V5.383ZM14.966 12.259L9.326 8.788L8 9.583L6.674 8.788L1.034 12.258C1.09083 12.4708 1.21632 12.6589 1.39099 12.7931C1.56566 12.9272 1.77975 13 2 13H14C14.2201 13 14.4341 12.9274 14.6088 12.7934C14.7834 12.6595 14.909 12.4716 14.966 12.259ZM1 11.105L5.708 8.208L1 5.383V11.105Z"
                fill="#0072EC"
              />
            </svg>
            <FormattedMessage id={`capital.listings.wantTo.forListing.${listing.type}`} />
          </Link>
        )}
      </td>
    </tr>
  );
};
