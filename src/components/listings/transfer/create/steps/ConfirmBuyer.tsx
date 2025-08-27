import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useCreateCapitalTransferContext } from '../hooks';
import { useMe } from '../../../../common/apiHooks';
import { MemberLookup } from '../../../../common/apiModels';
import { Loader } from '../../../../common';
import { getMemberLookup } from '../../../../common/api';

export const ConfirmBuyer = () => {
  const history = useHistory();
  const { data: me } = useMe();
  const { buyer, setBuyer, navigateToNextStep } = useCreateCapitalTransferContext();

  const [personalCode, setPersonalCode] = useState(buyer?.personalCode ?? null);

  const [noBuyerError, setNoBuyerError] = useState(false);
  const [selfBuyerError, setSelfBuyerError] = useState(false);

  // TODO does not look like the best

  const [searched, setSearched] = useState<MemberLookup | 'NOT_FOUND' | null>(buyer ?? null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearchClicked = () => {
    setSelfBuyerError(false);
    setNoBuyerError(false);
    lookupMember();
  };

  const lookupMember = async () => {
    if (personalCode === null) {
      return null;
    }

    try {
      setIsLoading(true);
      setSearched(await getMemberLookup(personalCode.trim()));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e); // TODO
      setSearched('NOT_FOUND');
    }

    setIsLoading(false);
    return null;
  };

  const handleSubmitClicked = () => {
    if (!searched || searched === 'NOT_FOUND') {
      setNoBuyerError(true);
      return;
    }

    if (searched.personalCode === me?.personalCode) {
      setSelfBuyerError(true);
      return;
    }

    setBuyer(searched);
    navigateToNextStep();
  };

  return (
    <>
      <div>
        <label htmlFor="id-code-search" className="form-label">
          Sisesta ostja isikukood
        </label>
        <div className="d-flex">
          <input
            type="text"
            id="id-code-search"
            className="form-control form-control-lg pe-0"
            aria-label="Sisesta ostja isikukood"
            value={personalCode ?? ''}
            onChange={(e) => setPersonalCode(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-lg btn-light ms-2"
            disabled={isLoading}
            onClick={() => handleSearchClicked()}
          >
            Otsin
          </button>
        </div>

        <SearchResponse loading={isLoading} searched={buyer ?? searched} />

        {noBuyerError && (searched === 'NOT_FOUND' || !searched) && (
          <div className="text-danger pt-2">Jätkamiseks sisesta ostja</div>
        )}

        {selfBuyerError && <div className="text-danger pt-2">Ostjaks ei saa määrata iseennast</div>}

        <div className="d-flex justify-content-between mt-4 pt-4 border-top">
          <button
            type="button"
            className="btn btn-lg btn-light"
            onClick={() => history.push('/capital/listings')}
          >
            Tagasi
          </button>
          <button
            type="button"
            className="btn btn-lg btn-primary"
            disabled={noBuyerError && !searched}
            onClick={() => handleSubmitClicked()}
          >
            Kinnitan ostja
          </button>
        </div>
      </div>
    </>
  );
};

const SearchResponse = ({
  loading,
  searched,
}: {
  loading: boolean;
  searched: MemberLookup | 'NOT_FOUND' | null | undefined;
}) => {
  if (loading) {
    return <Loader className="align-middle" />;
  }

  if (!searched) {
    return null;
  }

  if (searched === 'NOT_FOUND') {
    return (
      <div className="pt-5 text-danger">
        Sellele isikukoodile ei vasta ühtegi Tuleva ühistu liiget.
      </div>
    );
  }

  return (
    <div className="pt-5">
      <b>Sellele isikukoodile vastab</b>
      <div className="d-flex align-items-center mt-2">
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
          >
            <path
              d="M25 32C26.8565 32 28.637 31.2625 29.9497 29.9497C31.2625 28.637 32 26.8565 32 25C32 23.1435 31.2625 21.363 29.9497 20.0503C28.637 18.7375 26.8565 18 25 18C23.1435 18 21.363 18.7375 20.0503 20.0503C18.7375 21.363 18 23.1435 18 25C18 26.8565 18.7375 28.637 20.0503 29.9497C21.363 31.2625 23.1435 32 25 32ZM28.358 23.014L25.688 27.466C25.5707 27.6616 25.4103 27.8279 25.219 27.9521C25.0278 28.0764 24.8107 28.1554 24.5843 28.1832C24.3579 28.211 24.1282 28.1868 23.9126 28.1124C23.6969 28.038 23.5011 27.9154 23.34 27.754L21.792 26.208C21.6042 26.0202 21.4987 25.7656 21.4987 25.5C21.4987 25.2344 21.6042 24.9798 21.792 24.792C21.9798 24.6042 22.2344 24.4987 22.5 24.4987C22.7656 24.4987 23.0202 24.6042 23.208 24.792L24.302 25.888L26.642 21.986C26.7095 21.8733 26.7985 21.775 26.904 21.6968C27.0095 21.6185 27.1294 21.5618 27.2568 21.5299C27.3842 21.4979 27.5166 21.4914 27.6465 21.5106C27.7765 21.5299 27.9013 21.5745 28.014 21.642C28.1267 21.7095 28.225 21.7985 28.3032 21.904C28.3815 22.0095 28.4382 22.1294 28.4701 22.2568C28.5021 22.3842 28.5086 22.5166 28.4894 22.6465C28.4701 22.7765 28.4255 22.9013 28.358 23.014ZM22 10C22 11.5913 21.3679 13.1174 20.2426 14.2426C19.1174 15.3679 17.5913 16 16 16C14.4087 16 12.8826 15.3679 11.7574 14.2426C10.6321 13.1174 10 11.5913 10 10C10 8.4087 10.6321 6.88258 11.7574 5.75736C12.8826 4.63214 14.4087 4 16 4C17.5913 4 19.1174 4.63214 20.2426 5.75736C21.3679 6.88258 22 8.4087 22 10ZM16 14C17.0609 14 18.0783 13.5786 18.8284 12.8284C19.5786 12.0783 20 11.0609 20 10C20 8.93913 19.5786 7.92172 18.8284 7.17157C18.0783 6.42143 17.0609 6 16 6C14.9391 6 13.9217 6.42143 13.1716 7.17157C12.4214 7.92172 12 8.93913 12 10C12 11.0609 12.4214 12.0783 13.1716 12.8284C13.9217 13.5786 14.9391 14 16 14Z"
              fill="#008300"
            />
            <path
              d="M16.512 28C16.283 27.3504 16.1293 26.6767 16.054 25.992H6C6.002 25.5 6.308 24.02 7.664 22.664C8.968 21.36 11.422 20 16 20C16.52 20 17.0133 20.0167 17.48 20.05C17.932 19.368 18.472 18.75 19.088 18.214C18.1547 18.074 17.1253 18.0027 16 18C6 18 4 24 4 26C4 28 6 28 6 28H16.512Z"
              fill="#008300"
            />
          </svg>
        </div>
        <div className="ps-3">
          <div className="fs-5">
            {searched.firstName} {searched.lastName}
          </div>
          <div className="text-secondary">Tuleva ühistu liige #{searched.memberNumber}</div>
        </div>
      </div>
    </div>
  );
};
