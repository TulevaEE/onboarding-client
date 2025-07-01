import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useMe, useMemberCapitalListings } from '../common/apiHooks';
import { Loader } from '../common';
import styles from './ListingDetails.module.scss';
import { MemberCapitalListing, User } from '../common/apiModels';
import { formatAmountForCount, formatAmountForCurrency, getFullName } from '../common/utils';

export const ListingDetails = () => {
  const { id: urlId } = useParams<{ id: string }>();

  const { data: listings } = useMemberCapitalListings();
  const { data: me } = useMe();

  const [message, setMessage] = useState<string>();

  const listing = listings?.find((otherListing) => otherListing.id === Number(urlId));

  useEffect(() => {
    // no conditional hooks
    if (listing && me && !message) {
      setMessage(getListingDefaultMessage(listing, me));
    }
  }, [listing, me]);

  if (!listings || !me) {
    return <Loader />;
  }

  if (!listing) {
    return (
      <div className="col-12 col-md-11 col-lg-9 mx-auto">
        <div className="my-5">
          <div className="alert alert-warning" role="alert">
            Sellist kuulutust ei leidu!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-12 col-md-11 col-lg-10 mx-auto">
      <div className="my-5">
        <h1 className="mb-4 text-center">
          {listing.type === 'BUY' ? 'Sõnum ostjale' : 'Sõnum müüjale'}
        </h1>
      </div>

      <section className={styles.listingDetailsContainer}>
        <div>
          <label htmlFor="unit-amount" className="form-label">
            Sõnum <span className="text-secondary fw-normal">(vajadusel täienda)</span>
          </label>
          <textarea
            className="form-control form-control-lg mt-1"
            id="unit-amount"
            aria-label="Sõnum"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={14}
          />
        </div>

        <div className="pt-5">
          <b>Sõnumile lisatakse automaatselt sinu kontaktandmed:</b>

          <div className="pt-3">{getFullName(me)}</div>
          <div>
            {me.email} · <Link to="/contact-details">Uuendan andmeid</Link>
          </div>
        </div>

        <div className={`d-flex justify-content-between mt-5 pt-4 ${styles.submitButtonGroup}`}>
          <button type="button" className="btn btn-lg btn-light">
            Tagasi
          </button>
          <button type="button" className="btn btn-lg btn-primary" disabled={!message}>
            Saadan {listing.type === 'BUY' ? 'ostjale' : 'müüjale'}
          </button>
        </div>
      </section>
    </div>
  );
};

const getListingDefaultMessage = (listing: MemberCapitalListing, me: User): string => {
  const units = formatAmountForCount(listing.units);
  const pricePerUnit = formatAmountForCurrency(listing.pricePerUnit);
  const totalAmount = formatAmountForCurrency(listing.units * listing.pricePerUnit);

  if (listing.language === 'EN') {
    return `
Hello!

${
  listing.type === 'BUY'
    ? `I’m interested in selling units of my membership capital.`
    : `I’m interested in buying units of your membership capital.`
}
Units: ${units}; Unit price: ${pricePerUnit}; Total amount: ${totalAmount}

If the number of units and price are suitable, please fill out the application included in this email, digitally sign it, and return it to me for review and my own digital signature. Afterward, we can jointly submit it to the board of Tuleva Commercial Association for consideration.

Thank you,
${getFullName(me)}`.trim();
  }

  return `
Tere!

${
  listing.type === 'BUY'
    ? `Olen huvitatud Tuleva ühistu liikmekapitali müümisest.`
    : `Olen huvitatud Tuleva ühistu liikmekapitali ostmisest.`
}
Ühikute arv: ${units}; Ühiku hind: ${pricePerUnit}; Summa: ${totalAmount}

Kui ühikute arv ja hind sobivad, palun täitke omalt poolt kirjaga kaasatulev avaldus, digiallkirjastage see, ning saatke mulle tutvumiseks ja ka minu poolt digiallkirjastamiseks tagasi. Seejärel saame juba selle ühiselt Tuleva ühistu juhatusele ülevaatamiseks saata.

Aitäh,
${getFullName(me)}`.trim();
};
