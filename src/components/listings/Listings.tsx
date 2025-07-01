import { ListingsList } from './components/ListingsList';

export const Listings = () => (
  <div className="col-12 col-md-11 col-lg-9 mx-auto">
    <div className="my-5">
      <h1 className="mb-4 text-center">Liikmekapitali kuulutused</h1>

      <p className="m-0 lead text-center">
        Tuleva ühistu liikmed saavad liikmekapitali omavahel osta ja müüa.
      </p>

      <p className="pt-3 lead text-center">
        Selleks lisa oma kuulutus või vasta olemasolevale ja esitage ühine avaldus. Ühistu juhatus
        vaatab saadetud avaldused iga kuu esimestel tööpäevadel üle ja kiidab tehingu heaks, kui see
        vastab kehtestatud korrale.
      </p>
    </div>

    <div className="my-5">
      <ListingsList />
    </div>
  </div>
);
