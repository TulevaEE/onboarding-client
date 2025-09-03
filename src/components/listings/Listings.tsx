import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { ListingsList } from './components/ListingsList';
import { TransferList } from './transfer/TransferList';
import { usePageTitle } from '../common/usePageTitle';

export const Listings = () => {
  usePageTitle('pageTitle.capitalListings');
  return (
    <div className="col-12 col-md-11 col-lg-9 mx-auto d-flex flex-column gap-5">
      <div className="d-flex flex-column gap-4 text-center">
        <h1 className="m-0">
          <FormattedMessage id="capital.listings.heading" />
        </h1>
        <p className="m-0 lead">
          <FormattedMessage id="capital.listings.intro" />
        </p>
        <p className="m-0 lead">
          <FormattedMessage id="capital.listings.instructions" />
        </p>
      </div>

      <div className="d-flex gap-2 justify-content-center">
        <Link to="/capital/listings/add" className="btn btn-light">
          <FormattedMessage id="capital.listings.add" />
        </Link>
        <Link to="/capital/transfer/create" className="btn btn-light">
          <FormattedMessage id="capital.listings.transfer" />
        </Link>
      </div>

      <TransferList />

      <ListingsList />
    </div>
  );
};
