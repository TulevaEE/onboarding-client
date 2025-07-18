import { Link } from 'react-router-dom';
import { useMemberCapitalListings } from '../common/apiHooks';
import { ListingsList } from './components/ListingsList';

export const Listings = () => {
  const { data: listings } = useMemberCapitalListings();

  return (
    <div className="col-12 col-md-11 col-lg-9 mx-auto">
      <div className="my-5 text-center">
        <h1 className="mb-4">Liikmekapitali kuulutused</h1>

        <p className="m-0 lead">
          Tuleva ühistu liikmed saavad liikmekapitali omavahel osta ja müüa.
        </p>

        <p className="pt-3 lead">
          Selleks lisa oma kuulutus või vasta olemasolevale ja esitage ühine avaldus. Ühistu juhatus
          vaatab saadetud avaldused iga kuu esimestel tööpäevadel üle ja kiidab tehingu heaks, kui
          see vastab kehtestatud korrale.
        </p>
        {(listings?.length ?? 0) > 0 && (
          <Link to="/capital/listings/add" className="mt-2 btn btn-primary align-middle">
            + Lisan kuulutuse
          </Link>
        )}
      </div>

      <div className="my-5">
        <ListingsList />
      </div>
    </div>
  );
};
