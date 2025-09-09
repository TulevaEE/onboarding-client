import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { useCreateCapitalTransferContext } from '../hooks';
import { useMe } from '../../../../common/apiHooks';
import { MemberLookup } from '../../../../common/apiModels';
import { getMemberLookup } from '../../../../common/api';
import { getFullName } from '../../../../common/utils';

export const ConfirmBuyer = () => {
  const history = useHistory();
  const { data: me } = useMe();
  const { buyer, setBuyer, navigateToNextStep } = useCreateCapitalTransferContext();

  const [personalCode, setPersonalCode] = useState(buyer?.personalCode ?? null);

  type ErrorId = 'selfBuyer' | 'notFound' | 'noBuyer' | null;
  const [errorId, setErrorId] = useState<ErrorId>(null);

  // TODO does not look like the best
  const [searched, setSearched] = useState<MemberLookup | 'NOT_FOUND' | null>(buyer ?? null);
  const [isLoading, setIsLoading] = useState(false);

  const errorMessageMap = {
    selfBuyer: 'capital.transfer.create.error.selfBuyer',
    notFound: 'capital.transfer.create.error.notFound',
    noBuyer: 'capital.transfer.create.error.noBuyer',
  } as const;

  const isNonNullErrorId = (e: ErrorId): e is Exclude<ErrorId, null> => e !== null;

  const handleSearchClicked = () => {
    const trimmed = (personalCode ?? '').trim();

    if (!trimmed) {
      setSearched(null);
      setErrorId('noBuyer');
      return;
    }

    if (trimmed === me?.personalCode) {
      setSearched(null);
      setErrorId('selfBuyer');
      return;
    }

    setErrorId(null);
    lookupMember();
  };

  const lookupMember = async () => {
    if (personalCode === null) {
      return null;
    }

    const trimmed = personalCode.trim();

    if (!trimmed || trimmed === me?.personalCode) {
      setSearched(null);
      return null;
    }

    try {
      setIsLoading(true);
      const result = await getMemberLookup(personalCode.trim());
      setSearched(result);
      setErrorId(null);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e); // TODO
      setSearched('NOT_FOUND');
      setErrorId('notFound');
    }

    setIsLoading(false);
    return null;
  };

  const handleSubmitClicked = () => {
    const trimmed = (personalCode ?? '').trim();

    if (!trimmed) {
      setErrorId('noBuyer');
      return;
    }

    if (trimmed === me?.personalCode) {
      setErrorId('noBuyer');
      return;
    }

    if (searched === 'NOT_FOUND') {
      setErrorId('noBuyer');
      return;
    }

    if (!searched) {
      setErrorId('noBuyer');
      return;
    }

    setBuyer(searched);
    navigateToNextStep();
  };

  return (
    <>
      <div className="d-flex flex-column gap-5 py-4">
        <div className="form-section d-flex flex-column gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchClicked();
            }}
          >
            <label htmlFor="id-code-search" className="form-label">
              <FormattedMessage id="capital.transfer.create.label.enterBuyerIdCode" />
            </label>
            <div className="d-flex gap-2">
              <input
                type="text"
                id="id-code-search"
                className="form-control form-control-lg"
                value={personalCode ?? ''}
                pattern="[0-9]*"
                inputMode="numeric"
                onChange={(e) => {
                  const { value } = e.target;
                  setSearched(null);
                  setPersonalCode(value);
                  const trimmed = value.trim();
                  setErrorId(trimmed && trimmed === me?.personalCode ? 'selfBuyer' : null);
                }}
              />
              <button
                type="submit"
                className="btn btn-lg btn-outline-primary d-flex align-items-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                    <span>
                      <FormattedMessage id="capital.transfer.create.button.searching" />
                    </span>
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                      className="align-top"
                      aria-hidden="true"
                    >
                      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
                    </svg>
                    <span role="status">
                      <FormattedMessage id="capital.transfer.create.button.search" />
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
          {isNonNullErrorId(errorId) && (
            <p className="m-0 text-danger">
              <FormattedMessage id={errorMessageMap[errorId]} />
            </p>
          )}
        </div>

        <SearchResponse loading={isLoading} searched={searched} />
      </div>

      <div className="d-flex flex-column-reverse flex-sm-row justify-content-between pt-4 border-top gap-3">
        <button
          type="button"
          className="btn btn-lg btn-light"
          onClick={() => history.push('/capital/listings')}
        >
          <FormattedMessage id="capital.transfer.create.button.back" />
        </button>
        <button
          type="button"
          className="btn btn-lg btn-primary"
          disabled={errorId === 'noBuyer' && !searched}
          onClick={() => handleSubmitClicked()}
        >
          <FormattedMessage id="capital.transfer.create.button.confirmBuyer" />
        </button>
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
  const { formatMessage } = useIntl();

  if (loading) {
    return null;
  }

  if (!searched) {
    return null;
  }

  if (searched === 'NOT_FOUND') {
    return null;
  }

  return (
    <div className="form-section d-flex flex-column gap-2">
      <p className="m-0 fw-bold">
        <FormattedMessage id="capital.transfer.create.searchResult.heading" />
      </p>
      <div className="d-flex align-items-center gap-3">
        <span className="text-success" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m1.679-4.493-1.335 2.226a.75.75 0 0 1-1.174.144l-.774-.773a.5.5 0 0 1 .708-.708l.547.548 1.17-1.951a.5.5 0 1 1 .858.514M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4" />
            <path d="M8.256 14a4.5 4.5 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10q.39 0 .74.025c.226-.341.496-.65.804-.918Q8.844 9.002 8 9c-5 0-6 3-6 4s1 1 1 1z" />
          </svg>
        </span>
        <span>
          <span className="d-block lead">{getFullName(searched)}</span>
          <span className="d-block text-secondary">
            {formatMessage(
              { id: 'capital.transfer.create.member.label' },
              { memberNumber: searched.memberNumber },
            )}
          </span>
        </span>
      </div>
    </div>
  );
};
