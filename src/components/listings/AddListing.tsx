import { PropsWithChildren, ReactNode, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import moment from 'moment';
import styles from './AddListing.module.scss';
import { useNumberInput } from '../common/utils';
import { useCreateMemberCapitalListing, useMe } from '../common/apiHooks';
import { useMemberCapitalHoldings } from './hooks';
import { MemberCapitalListingType } from '../common/apiModels';

// TODO break up this component
export const AddListing = () => {
  const history = useHistory();

  const [listingType, setListingType] = useState<MemberCapitalListingType>('BUY');

  const [expiryInMonths, setExpiryInMonths] = useState<number>(1);

  const unitPriceInput = useNumberInput();
  const unitAmountInput = useNumberInput();

  const { mutateAsync: createListing, error } = useCreateMemberCapitalListing();

  const memberCapitalHoldings = useMemberCapitalHoldings();

  const [submitting, setSubmitting] = useState(false);

  const errors = {
    noPriceValue: typeof unitPriceInput.value !== 'number',
    noUnitAmountValue: typeof unitPriceInput.value !== 'number',
    moreThanMemberCapital:
      listingType === 'SELL' &&
      memberCapitalHoldings !== null &&
      memberCapitalHoldings < (unitAmountInput.value ?? 0),
    priceLessThanBookValue: unitPriceInput.value !== null && unitPriceInput.value < 1,
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    if (unitAmountInput.value === null || unitPriceInput.value === null) {
      return;
    }

    const expiryTime = moment().add(expiryInMonths, 'months').endOf('day').toISOString();

    try {
      await createListing({
        type: listingType,
        units: unitAmountInput.value,
        pricePerUnit: unitPriceInput.value,
        currency: 'EUR',
        expiryTime,
      });
      history.push('/capital/listings');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="col-12 col-md-11 col-lg-9 mx-auto">
      <div className="my-5">
        <h1 className="mb-4 text-center">Uus kuulutus</h1>
      </div>

      <section className={`my-5 ${styles.addListingContainer}`}>
        {error && (
          <div className="alert alert-danger">
            Kuulutuse lisamisel tekkis viga. Palun võta meiega ühendust
          </div>
        )}
        <div className="btn-group d-flex" role="group" aria-label="Basic example">
          <ListingButton
            listingType={listingType}
            listingTypeOfButton="BUY"
            onSetListingType={setListingType}
          >
            Ostan
          </ListingButton>

          <ListingButton
            listingType={listingType}
            listingTypeOfButton="SELL"
            onSetListingType={setListingType}
          >
            Müün
          </ListingButton>
        </div>

        <div className="row mt-5">
          <div className="col-lg mb-3 mb-lg-0">
            <div>
              <label htmlFor="unit-amount" className="form-label">
                Ühikute arv
              </label>
              <input
                type="number"
                className={`form-control form-control-lg text-end pe-0 ${
                  errors.moreThanMemberCapital ? 'border-danger' : ''
                }`}
                id="unit-amount"
                placeholder="0"
                aria-label="Ühikute arv"
                {...unitAmountInput.inputProps}
              />
            </div>
          </div>
          <div className="col-lg mb-3 mb-lg-0">
            <div>
              <label htmlFor="unit-price" className="form-label">
                Ühiku hind
              </label>
              <div className="input-group input-group-lg">
                <input
                  type="number"
                  placeholder="0"
                  id="unit-price"
                  aria-label="Ühiku hind"
                  className={`form-control form-control-lg text-end pe-0 ${
                    errors.priceLessThanBookValue ? 'border-danger' : ''
                  }`}
                  {...unitPriceInput.inputProps}
                />
                <div className="input-group-text">&euro;</div>
              </div>
            </div>
          </div>
          <div className="col-lg mb-3 mb-lg-0">
            <div>
              <label htmlFor="unit-amount" className="form-label">
                Kogusumma
              </label>
              <div className="input-group input-group-lg">
                <input
                  value={(unitAmountInput.value ?? 0) * (unitPriceInput.value ?? 0)}
                  type="number"
                  disabled
                  className="form-control form-control-lg text-end pe-0"
                  aria-label="Kogusumma"
                />
                <div className="input-group-text">&euro;</div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-secondary mt-2">
          Sul on hetkel liikmekapitali{' '}
          {memberCapitalHoldings !== null ? (
            <>
              <b>{memberCapitalHoldings}</b> ühikut
            </>
          ) : (
            '...'
          )}
          . Ühe ühiku raamatupidamislik väärtus on 1.00 € ja alla selle tehingut teostada ei saa.
        </div>

        {errors.moreThanMemberCapital && (
          <div className="pt-2 text-danger">
            Ühikute arv ei saa olla suurem sinu liikmekapitali kogumahust.
          </div>
        )}
        {errors.priceLessThanBookValue && (
          <div className="pt-2 text-danger">
            Ühiku hind ei saa olla väiksem raamatupidamislikust väärtusest 1.00 €.
          </div>
        )}
        <div className="row mt-4">
          <div className="col-lg mb-3 mb-lg-0">
            <div>
              <label htmlFor="unit-amount" className="form-label">
                Kuulutus aegub automaatselt
              </label>
              <div className="input-group input-group-lg">
                <select
                  value={expiryInMonths}
                  onChange={(e) => setExpiryInMonths(Number(e.target.value))}
                  className="form-select form-control-lg"
                  placeholder="0"
                  aria-label="Kuulutuse kestus kuudes"
                >
                  <option value="1">1 kuu pärast</option>
                  <option value="3">3 kuu pärast</option>
                  <option value="6">6 kuu pärast</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <AssurancesSection />
        </div>

        <div className="d-flex justify-content-between mt-5 pt-4 border-top">
          <button type="button" className="btn btn-lg btn-light" onClick={() => history.goBack()}>
            Tagasi
          </button>
          <button
            type="button"
            className="btn btn-lg btn-primary"
            onClick={handleSubmit}
            disabled={submitting || errors.moreThanMemberCapital || errors.priceLessThanBookValue}
          >
            Avaldan ostukuulutuse
          </button>
        </div>
      </section>
    </div>
  );
};

const AssurancesSection = () => {
  const { data: user } = useMe();

  return (
    <>
      <AssuranceItem
        svg={
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 4C0 3.46957 0.210714 2.96086 0.585786 2.58579C0.960859 2.21071 1.46957 2 2 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V12C16 12.5304 15.7893 13.0391 15.4142 13.4142C15.0391 13.7893 14.5304 14 14 14H2C1.46957 14 0.960859 13.7893 0.585786 13.4142C0.210714 13.0391 0 12.5304 0 12V4ZM2 3C1.73478 3 1.48043 3.10536 1.29289 3.29289C1.10536 3.48043 1 3.73478 1 4V4.217L8 8.417L15 4.217V4C15 3.73478 14.8946 3.48043 14.7071 3.29289C14.5196 3.10536 14.2652 3 14 3H2ZM15 5.383L10.292 8.208L15 11.105V5.383ZM14.966 12.259L9.326 8.788L8 9.583L6.674 8.788L1.034 12.258C1.09083 12.4708 1.21632 12.6589 1.39099 12.7931C1.56566 12.9272 1.77975 13 2 13H14C14.2201 13 14.4341 12.9274 14.6088 12.7934C14.7834 12.6595 14.909 12.4716 14.966 12.259ZM1 11.105L5.708 8.208L1 5.383V11.105Z"
              fill="#293036"
            />
          </svg>
        }
      >
        Huvilised saavad vastata sulle Tuleva vahendusel:
        <br />
        {user?.email} · <Link to="/contact-details">Uuendan andmeid</Link>
      </AssuranceItem>

      <AssuranceItem
        svg={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M5.33801 1.59C4.38555 1.85232 3.4396 2.13774 2.50101 2.446C2.41523 2.47366 2.33898 2.52491 2.28098 2.59388C2.22297 2.66285 2.18555 2.74676 2.17301 2.836C1.61901 6.993 2.89901 10.026 4.42601 12.024C5.07224 12.8786 5.84317 13.6314 6.71301 14.257C7.05901 14.501 7.36501 14.677 7.60601 14.79C7.72601 14.8467 7.82367 14.886 7.89901 14.908C7.93222 14.9181 7.96593 14.9264 8.00001 14.933C8.03375 14.9264 8.06712 14.918 8.10001 14.908C8.17601 14.8853 8.27401 14.846 8.39401 14.79C8.63401 14.677 8.94101 14.5 9.28701 14.257C10.1568 13.6314 10.9278 12.8786 11.574 12.024C13.101 10.027 14.381 6.993 13.827 2.836C13.8145 2.74676 13.777 2.66285 13.719 2.59388C13.661 2.52491 13.5848 2.47366 13.499 2.446C12.848 2.233 11.749 1.886 10.662 1.591C9.55201 1.29 8.53101 1.067 8.00001 1.067C7.47001 1.067 6.44801 1.289 5.33801 1.59ZM5.07201 0.56C6.15701 0.265 7.31001 0 8.00001 0C8.69001 0 9.84301 0.265 10.928 0.56C12.038 0.86 13.157 1.215 13.815 1.43C14.0901 1.52085 14.334 1.68747 14.5187 1.9107C14.7034 2.13394 14.8213 2.40474 14.859 2.692C15.455 7.169 14.072 10.487 12.394 12.682C11.6822 13.6207 10.8338 14.4476 9.87701 15.135C9.54653 15.3734 9.19587 15.5826 8.82901 15.76C8.54901 15.892 8.24801 16 8.00001 16C7.75201 16 7.45201 15.892 7.17101 15.76C6.80415 15.5826 6.45348 15.3734 6.12301 15.135C5.16626 14.4476 4.31785 13.6207 3.60601 12.682C1.92801 10.487 0.545005 7.169 1.14101 2.692C1.17869 2.40474 1.29665 2.13394 1.48132 1.9107C1.666 1.68747 1.9099 1.52085 2.18501 1.43C3.14026 1.11701 4.10287 0.826926 5.07201 0.56Z"
              fill="#293036"
            />
            <path
              d="M10.8541 5.14592C10.9007 5.19236 10.9376 5.24754 10.9629 5.30828C10.9881 5.36903 11.001 5.43415 11.001 5.49992C11.001 5.56568 10.9881 5.63081 10.9629 5.69155C10.9376 5.7523 10.9007 5.80747 10.8541 5.85392L7.85414 8.85392C7.8077 8.90048 7.75252 8.93742 7.69178 8.96263C7.63103 8.98784 7.56591 9.00081 7.50014 9.00081C7.43438 9.00081 7.36925 8.98784 7.30851 8.96263C7.24776 8.93742 7.19259 8.90048 7.14614 8.85392L5.64614 7.35392C5.59966 7.30743 5.56278 7.25224 5.53762 7.1915C5.51246 7.13076 5.49951 7.06566 5.49951 6.99992C5.49951 6.93417 5.51246 6.86907 5.53762 6.80833C5.56278 6.74759 5.59966 6.6924 5.64614 6.64592C5.69263 6.59943 5.74782 6.56255 5.80856 6.53739C5.8693 6.51223 5.9344 6.49929 6.00014 6.49929C6.06589 6.49929 6.13099 6.51223 6.19173 6.53739C6.25247 6.56255 6.30766 6.59943 6.35414 6.64592L7.50014 7.79292L10.1461 5.14592C10.1926 5.09935 10.2478 5.06241 10.3085 5.0372C10.3693 5.012 10.4344 4.99902 10.5001 4.99902C10.5659 4.99902 10.631 5.012 10.6918 5.0372C10.7525 5.06241 10.8077 5.09935 10.8541 5.14592Z"
              fill="#293036"
            />
          </svg>
        }
      >
        Sinu nimi ega meiliaadress pole avalikult nähtavad seni, kuniks sa mõnele huvilisele ise ei
        vasta.
      </AssuranceItem>

      <AssuranceItem
        svg={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <g clipPath="url(#clip0_3745_2759)">
              <path
                d="M15 8C15.0026 6.31557 14.3952 4.68718 13.29 3.416L3.416 13.291C4.43021 14.1698 5.67567 14.7386 7.004 14.9295C8.33234 15.1205 9.68757 14.9255 10.9083 14.368C12.1289 13.8104 13.1636 12.9138 13.8891 11.7847C14.6145 10.6557 15.0001 9.34199 15 8ZM2.71 12.584L12.584 2.709C11.2462 1.55067 9.51928 0.942016 7.75082 1.00552C5.98235 1.06902 4.30356 1.79996 3.05226 3.05126C1.80096 4.30256 1.07002 5.98135 1.00652 7.74982C0.943016 9.51828 1.55167 11.2462 2.71 12.584ZM16 8C16 10.1217 15.1571 12.1566 13.6569 13.6569C12.1566 15.1571 10.1217 16 8 16C5.87827 16 3.84344 15.1571 2.34315 13.6569C0.842855 12.1566 0 10.1217 0 8C0 5.87827 0.842855 3.84344 2.34315 2.34315C3.84344 0.842855 5.87827 0 8 0C10.1217 0 12.1566 0.842855 13.6569 2.34315C15.1571 3.84344 16 5.87827 16 8Z"
                fill="black"
              />
            </g>
            <defs>
              <clipPath id="clip0_3745_2759">
                <rect width="16" height="16" fill="white" />
              </clipPath>
            </defs>
          </svg>
        }
      >
        Tehingutasud puuduvad.
      </AssuranceItem>
    </>
  );
};

const AssuranceItem = ({ children, svg }: PropsWithChildren<{ svg: ReactNode }>) => (
  <div className="d-flex pb-3">
    <div className="ms-1">{svg}</div>
    <div className="ms-2">{children}</div>
  </div>
);

const ListingButton = ({
  children,
  listingType,
  listingTypeOfButton,
  onSetListingType,
}: PropsWithChildren<{
  listingType: MemberCapitalListingType;
  listingTypeOfButton: MemberCapitalListingType;
  onSetListingType: (listingTypeOfButton: MemberCapitalListingType) => unknown;
}>) => (
  <button
    type="button"
    onClick={() => onSetListingType(listingTypeOfButton)}
    className={`btn ${listingType === listingTypeOfButton ? 'btn-primary' : `btn-light`}`}
  >
    {children}
  </button>
);
