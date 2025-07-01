import { Link } from 'react-router-dom';
import styles from './ListingsList.module.scss';
import { useMemberCapitalListings } from '../../common/apiHooks';
import Loader from '../../common/loader';
import { MemberCapitalListing } from '../../common/apiModels';
import { formatAmountForCount, formatAmountForCurrency } from '../../common/utils';

export const ListingsList = () => {
  const { data: listings } = useMemberCapitalListings();

  if (!listings) {
    return <Loader />;
  }

  if (listings.length === 0) {
    return (
      <div className={styles.noListingsContainer}>
        <div className="text-secondary">Aktiivseid kuulutusi ei ole</div>
        <Link to="/capital/listings/add" className="mt-4 btn btn-primary">
          + Lisan kuulutuse
        </Link>
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
      <th scope="col">Kuulutus</th>
      <th scope="col">Ühikute arv</th>
      <th scope="col">Ühiku hind</th>
      <th scope="col">Kogusumma</th>
      <th scope="col">Tegevus</th>
    </tr>
  </thead>
);

const ListingRow = ({ listing }: { listing: MemberCapitalListing }) => (
  <tr>
    <td>
      {listing.type === 'BUY' ? 'Ost' : 'Müük'} #{listing.id}
    </td>
    <td>{formatAmountForCount(listing.units)}</td>
    <td>{formatAmountForCurrency(listing.pricePerUnit)}</td>
    <td>{formatAmountForCurrency(listing.units * listing.pricePerUnit)}</td>
    <td>
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
        {listing.type === 'BUY' ? 'Soovin müüa' : 'Soovin osta'}
      </Link>
    </td>
  </tr>
);
