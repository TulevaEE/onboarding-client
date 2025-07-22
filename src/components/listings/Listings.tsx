import { Link } from 'react-router-dom';
import { ListingsList } from './components/ListingsList';
import { TransferList } from './transfer/TransferList';

export const Listings = () => (
  <div className="col-12 col-md-11 col-lg-9 mx-auto">
    <div className="my-5 text-center">
      <h1 className="mb-4">Liikmekapitali kuulutused</h1>

      <p className="m-0 lead">Tuleva ühistu liikmed saavad liikmekapitali omavahel osta ja müüa.</p>

      <p className="pt-3 lead">
        Selleks lisa oma kuulutus või vasta olemasolevale ja esitage ühine avaldus. Ühistu juhatus
        vaatab saadetud avaldused iga kuu esimestel tööpäevadel üle ja kiidab tehingu heaks, kui see
        vastab kehtestatud korrale.
      </p>
      <Link to="/capital/listings/add" className="mt-2 btn btn-light align-middle">
        + Lisan kuulutuse
      </Link>
      <Link to="/capital/transfer/create" className="mt-2 ms-2 btn btn-light align-middle">
        Vormistan müügi
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
