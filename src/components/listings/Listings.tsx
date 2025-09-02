import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { ListingsList } from './components/ListingsList';
import { TransferList } from './transfer/TransferList';

export const Listings = () => (
  <div className="col-12 col-md-11 col-lg-9 mx-auto">
    <div className="my-5 text-center">
      <h1 className="mb-4">
        <FormattedMessage id="capital.listings.heading" />
      </h1>

      <p className="m-0 lead">
        <FormattedMessage id="capital.listings.intro" />
      </p>

      <p className="pt-3 lead">
        <FormattedMessage id="capital.listings.instructions" />
      </p>

      <Link to="/capital/listings/add" className="mt-2 btn btn-light align-middle">
        <FormattedMessage id="capital.listings.add" />
      </Link>
      <Link to="/capital/transfer/create" className="mt-2 ms-2 btn btn-light align-middle">
        <FormattedMessage id="capital.listings.transfer" />
      </Link>
    </div>

    <div className="my-5">
      <TransferList />
    </div>

    <div className="my-5">
      <ListingsList />
    </div>
  </div>
);
