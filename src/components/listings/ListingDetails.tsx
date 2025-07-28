import { Link, useHistory, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import config from 'react-global-configuration';
import {
  useContactMemberCapitalListing,
  useMe,
  useMemberCapitalListings,
} from '../common/apiHooks';
import { Loader } from '../common';
import styles from './ListingDetails.module.scss';
import { MemberCapitalListing, User } from '../common/apiModels';
import { formatAmountForCount, formatAmountForCurrency, getFullName } from '../common/utils';
import { SuccessAlert } from '../common/successAlert';

export const ListingDetails = () => {
  const { id: urlId } = useParams<{ id: string }>();

  const { data: listings } = useMemberCapitalListings();
  const {
    mutate: sendMessageRequest,
    isLoading: sending,
    error,
  } = useContactMemberCapitalListing();
  const { data: me } = useMe();

  const [message, setMessage] = useState<string>();

  const [success, setSuccess] = useState(false);

  const history = useHistory();

  const listing = listings?.find((otherListing) => otherListing.id === Number(urlId));

  const handleContactButtonClicked = async () => {
    if (!listing || !message) {
      return;
    }

    await sendMessageRequest({ message, id: listing?.id });
    setSuccess(true);
  };

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

  if (success) {
    <SuccessAlert>
      <h2 className="py-2">Sõnum on saadetud</h2>

      <div className="pb-2">Jää ootele, kuulutuse lisaja annab sulle loodetavasti peagi märku.</div>

      <button
        type="button"
        className="btn btn-outline-primary my-3"
        onClick={() => {
          history.push(`/capital/listings/`);
        }}
      >
        Vaatan kõiki kuulutusi
      </button>
    </SuccessAlert>;
  }

  /* if (listing.isOwnListing) {
    return <Redirect to="/capital/listings/" />;
  } */

  const isDifferentLanguage = config.get('language') !== listing.language;

  return (
    <div className="col-12 col-md-11 col-lg-10 mx-auto">
      <div className="my-5">
        <h1 className="mb-4 text-center">
          {listing.type === 'BUY' ? 'Sõnum ostjale' : 'Sõnum müüjale'}
        </h1>
      </div>

      <section className={styles.listingDetailsContainer}>
        {isDifferentLanguage && (
          <div className="alert alert-info d-flex">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="me-2 mt-1"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <g clipPath="url(#clip0_3687_5210)">
                <path
                  d="M8 15C6.14348 15 4.36301 14.2625 3.05025 12.9497C1.7375 11.637 1 9.85652 1 8C1 6.14348 1.7375 4.36301 3.05025 3.05025C4.36301 1.7375 6.14348 1 8 1C9.85652 1 11.637 1.7375 12.9497 3.05025C14.2625 4.36301 15 6.14348 15 8C15 9.85652 14.2625 11.637 12.9497 12.9497C11.637 14.2625 9.85652 15 8 15ZM8 16C10.1217 16 12.1566 15.1571 13.6569 13.6569C15.1571 12.1566 16 10.1217 16 8C16 5.87827 15.1571 3.84344 13.6569 2.34315C12.1566 0.842855 10.1217 0 8 0C5.87827 0 3.84344 0.842855 2.34315 2.34315C0.842855 3.84344 0 5.87827 0 8C0 10.1217 0.842855 12.1566 2.34315 13.6569C3.84344 15.1571 5.87827 16 8 16Z"
                  fill="#002F63"
                />
                <path
                  d="M8.92995 6.588L6.63995 6.875L6.55795 7.255L7.00795 7.338C7.30195 7.408 7.35995 7.514 7.29595 7.807L6.55795 11.275C6.36395 12.172 6.66295 12.594 7.36595 12.594C7.91095 12.594 8.54395 12.342 8.83095 11.996L8.91895 11.58C8.71895 11.756 8.42695 11.826 8.23295 11.826C7.95795 11.826 7.85795 11.633 7.92895 11.293L8.92995 6.588ZM8.99995 4.5C8.99995 4.76522 8.8946 5.01957 8.70706 5.20711C8.51952 5.39464 8.26517 5.5 7.99995 5.5C7.73474 5.5 7.48038 5.39464 7.29285 5.20711C7.10531 5.01957 6.99995 4.76522 6.99995 4.5C6.99995 4.23478 7.10531 3.98043 7.29285 3.79289C7.48038 3.60536 7.73474 3.5 7.99995 3.5C8.26517 3.5 8.51952 3.60536 8.70706 3.79289C8.8946 3.98043 8.99995 4.23478 8.99995 4.5Z"
                  fill="#002F63"
                />
              </g>
              <defs>
                <clipPath id="clip0_3687_5210">
                  <rect width="16" height="16" fill="white" />
                </clipPath>
              </defs>
            </svg>
            See kuulutus on lisatud inglise keeles, seega tõenäoliselt eeldab ostja suhtlust samuti
            inglise keeles.
          </div>
        )}
        {error && (
          <div className="alert alert-warning">
            Sõnumi saatmisel tekkis viga. Palun proovi hiljem uuesti või võta meiega ühendust
          </div>
        )}
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

        <div className="d-flex justify-content-between mt-5 pt-4 border-top">
          <button type="button" className="btn btn-lg btn-light" onClick={() => history.goBack()}>
            Tagasi
          </button>
          <button
            type="button"
            className="btn btn-lg btn-primary"
            disabled={!message || sending}
            onClick={() => handleContactButtonClicked()}
          >
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

  if (listing.language === 'en') {
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
